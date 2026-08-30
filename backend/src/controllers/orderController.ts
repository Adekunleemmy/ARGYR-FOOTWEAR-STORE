import { Request, Response, NextFunction } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { OrderCreateSchema, OrderStatusUpdateSchema } from '../schemas/zodSchemas';
import { calculateOrderPricing } from '../services/pricingService';
import { formatOrderWhatsAppMessage, generateWhatsAppUrl } from '../utils/whatsappHelper';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * Public: Create an order enquiry
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
          selectedSize: item.selectedSize,
          selectedColour: item.selectedColour,
          quantity: item.quantity,
          unitPrice: pricingInfo.appliedUnitPrice,
          estimatedSubtotal: pricingInfo.estimatedSubtotal
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
 * Admin: Retrieve all order enquiries
 */
export async function adminGetOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get single order details
 */
export async function adminGetOrderDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
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
 * Admin: Update order enquiry status
 */
export async function adminUpdateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = OrderStatusUpdateSchema.parse(req.body);

    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ success: true, message: `Order status updated to ${status}`, order });
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
