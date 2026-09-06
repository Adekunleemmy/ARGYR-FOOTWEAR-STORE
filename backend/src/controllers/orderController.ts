import { Request, Response, NextFunction } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { OrderCreateSchema, OrderStatusUpdateSchema } from '../schemas/zodSchemas';
import { calculateOrderPricing } from '../services/pricingService';
import { formatOrderWhatsAppMessage, generateWhatsAppUrl } from '../utils/whatsappHelper';
import { sendOrderStatusUpdateEmail } from '../services/emailService';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * Public: Create an order enquiry (Legacy WhatsApp workflow preserved for backward compatibility)
 */
export async function createOrderEnquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = OrderCreateSchema.parse(req.body);
    const { items, ...customerData } = validatedData;

    // 1. Authoritatively calculate order totals and apply bulk pricing rules
    const pricingItemsInput = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    
    const pricingDetails = await calculateOrderPricing(pricingItemsInput);

    // 2. Generate a unique human-readable order reference
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const orderReference = `ARGYR-${randomCode}`;

    // 3. Create the order and items within a database transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderReference,
          customerName: customerData.customerName,
          customerPhone: customerData.customerPhone,
          customerEmail: customerData.customerEmail,
          deliveryCountry: customerData.deliveryCountry,
          deliveryCity: customerData.deliveryCity,
          deliveryAddress: customerData.deliveryAddress,
          notes: customerData.notes,
          subtotal: pricingDetails.subtotal,
          estimatedTotal: pricingDetails.estimatedTotal,
          totalAmount: pricingDetails.estimatedTotal,
          status: OrderStatus.NEW,
          whatsappMessage: '' // Temporary empty, will populate next
        }
      });

      const orderItemsData = items.map(item => {
        const pricingInfo = pricingDetails.items.find(p => p.productId === item.productId)!;
        return {
          orderId: newOrder.id,
          productId: item.productId,
          productName: pricingInfo.name,
          productSku: pricingInfo.sku,
          productImage: pricingInfo.imageUrl,
          selectedSize: item.selectedSize,
          selectedColour: item.selectedColour,
          quantity: item.quantity,
          unitPrice: pricingInfo.appliedUnitPrice,
          estimatedSubtotal: pricingInfo.subtotal,
          subtotal: pricingInfo.subtotal
        };
      });

      await tx.orderItem.createMany({
        data: orderItemsData
      });

      // Fetch newly created order with items to format WhatsApp message
      const completeOrder = await tx.order.findUnique({
        where: { id: newOrder.id },
        include: { items: true }
      });

      if (!completeOrder) {
        throw new Error("Failed to create order reference.");
      }

      // Generate pre-filled WhatsApp message
      const formattedMsg = formatOrderWhatsAppMessage(completeOrder);

      // Save the message template to order logs
      return tx.order.update({
        where: { id: newOrder.id },
        data: { whatsappMessage: formattedMsg },
        include: { items: true }
      });
    });

    // 4. Retrieve settings for current store WhatsApp number
    const whatsappSetting = await prisma.setting.findUnique({
      where: { key: "WHATSAPP_BUSINESS_NUMBER" }
    });
    const whatsappNumber = whatsappSetting?.value || config.DEFAULT_WHATSAPP_NUMBER;

    // 5. Generate WhatsApp redirect link
    const whatsappUrl = generateWhatsAppUrl(whatsappNumber, order.whatsappMessage);

    res.status(201).json({
      success: true,
      message: "Order enquiry created successfully",
      order: {
        id: order.id,
        orderReference: order.orderReference,
        estimatedTotal: order.estimatedTotal,
        whatsappUrl
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Retrieve all orders with search, status filters, and pagination support
 */
export async function adminGetOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { orderReference: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { deliveryCity: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        payments: {
          select: {
            id: true,
            transactionReference: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            paidAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get single order details with full item snapshots, payments, and timeline
 */
export async function adminGetOrderDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update order status with audit log and customer status update email
 */
export async function adminUpdateOrderStatus(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, internalNote, customerNote } = OrderStatusUpdateSchema.parse(req.body);

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const previousStatus = existingOrder.status;

    // Transaction: update order status + add status history entry
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus,
          newStatus: status,
          internalNote: internalNote || null,
          customerNote: customerNote || null,
          changedBy: req.admin?.id || 'ADMIN'
        }
      });

      return order;
    });

    // Send transactional status update email if moving into fulfillment stages
    const emailEligibleStatuses: OrderStatus[] = [
      OrderStatus.IN_PRODUCTION,
      OrderStatus.READY_FOR_SHIPPING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED
    ];

    if (emailEligibleStatuses.includes(status)) {
      sendOrderStatusUpdateEmail(
        existingOrder,
        existingOrder.customer,
        status,
        customerNote || undefined
      ).catch(err => {
        console.error("Failed to send status update email:", err);
      });
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Track when the user opens WhatsApp for an order
 */
export async function trackWhatsappClick(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const order = await prisma.order.update({
      where: { id },
      data: { whatsappOpenedAt: new Date() }
    });

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
}
