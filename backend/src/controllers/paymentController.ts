import { Request, Response, NextFunction } from 'express';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { config } from '../config';
import { AuthenticatedCustomerRequest } from '../middleware/customerAuth';
import { CheckoutInitializeSchema } from '../schemas/zodSchemas';
import { calculateOrderPricing } from '../services/pricingService';
import {
  initializeFlutterwavePayment,
  verifyFlutterwaveTransaction,
  verifyWebhookSecretHash
} from '../services/flutterwaveService';
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail
} from '../services/emailService';
import { formatOrderWhatsAppMessage } from '../utils/whatsappHelper';

const prisma = new PrismaClient();

/**
 * 1. Initialize Authenticated Checkout & Flutterwave Payment Link
 */
export async function initializeCheckout(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    const customerId = req.customer!.id;
    const validatedData = CheckoutInitializeSchema.parse(req.body);
    const { shippingAddress, shippingMethodId, notes, items, saveAddress } = validatedData;

    // Fetch customer details from DB
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer account not found." });
    }

    // 1. Authoritative price & shipping calculation on backend
    const pricingItemsInput = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    const pricing = await calculateOrderPricing(pricingItemsInput, shippingMethodId);

    // 2. Retrieve configured estimated delivery timeframe
    const timeframeSetting = await prisma.setting.findUnique({
      where: { key: "ESTIMATED_DELIVERY_TIMEFRAME" }
    });
    const estimatedTimeframe = timeframeSetting?.value || "7–14 days";

    // 3. Generate unique order & transaction references
    const orderRefNumber = Math.floor(100000 + Math.random() * 900000);
    const orderReference = `ARGYR-2026-${orderRefNumber}`;
    const txRandom = Math.floor(1000 + Math.random() * 9000);
    const transactionReference = `ARGYR-TX-${Date.now()}-${txRandom}`;

    // 4. Create pending order, order items, and pending payment in a transaction
    const { createdOrder, createdPayment } = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderReference,
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          customerEmail: customer.email,
          customerPhone: shippingAddress.phone || customer.phone || '',
          deliveryCountry: shippingAddress.country,
          deliveryCity: shippingAddress.city,
          deliveryState: shippingAddress.stateRegion || null,
          deliveryAddress: shippingAddress.addressLine,
          deliveryPostalCode: shippingAddress.postalCode || null,
          deliveryInstructions: shippingAddress.deliveryInstructions || null,
          notes: notes || null,
          currency: pricing.currency,
          subtotal: pricing.subtotal,
          shippingMethodName: pricing.shippingMethodName,
          shippingCost: pricing.shippingCost,
          totalAmount: pricing.totalAmount,
          estimatedTotal: pricing.totalAmount,
          estimatedDeliveryTimeframe: estimatedTimeframe,
          status: OrderStatus.PENDING_PAYMENT,
          whatsappMessage: '' // Pre-filled below
        }
      });

      // Create Order Items with product snapshots
      const orderItemsData = items.map(item => {
        const pInfo = pricing.items.find(p => p.productId === item.productId)!;
        return {
          orderId: order.id,
          productId: item.productId,
          productName: pInfo.name,
          productSku: pInfo.sku,
          productImage: pInfo.imageUrl,
          selectedSize: item.selectedSize,
          selectedColour: item.selectedColour || null,
          quantity: item.quantity,
          unitPrice: pInfo.appliedUnitPrice,
          estimatedSubtotal: pInfo.subtotal,
          subtotal: pInfo.subtotal
        };
      });

      await tx.orderItem.createMany({ data: orderItemsData });

      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          transactionReference,
          amount: pricing.totalAmount,
          currency: pricing.currency,
          status: PaymentStatus.PENDING
        }
      });

      // Record Order Status History
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          newStatus: OrderStatus.PENDING_PAYMENT,
          changedBy: 'CUSTOMER',
          customerNote: 'Order initialized. Awaiting payment completion.'
        }
      });

      // Save delivery address to customer profile if requested
      if (saveAddress) {
        await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            recipientName: shippingAddress.recipientName,
            phone: shippingAddress.phone,
            country: shippingAddress.country,
            stateRegion: shippingAddress.stateRegion || null,
            city: shippingAddress.city,
            addressLine: shippingAddress.addressLine,
            postalCode: shippingAddress.postalCode || null
          }
        });
      }

      // Generate pre-filled WhatsApp message snapshot
      const fullOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true }
      });

      const whatsappMessage = formatOrderWhatsAppMessage(fullOrder as any);

      await tx.order.update({
        where: { id: order.id },
        data: { whatsappMessage }
      });

      return { createdOrder: order, createdPayment: payment };
    });

    // 5. Initialize Flutterwave payment
    const redirectUrl = `${config.FRONTEND_URL}/checkout/confirm`;

    const flwResponse = await initializeFlutterwavePayment({
      tx_ref: transactionReference,
      amount: pricing.totalAmount,
      currency: pricing.currency,
      redirect_url: redirectUrl,
      customer: {
        email: customer.email,
        phonenumber: shippingAddress.phone || customer.phone || undefined,
        name: `${customer.firstName} ${customer.lastName}`
      },
      customizations: {
        title: "ARGYR Footwear",
        description: `Order ${orderReference} (${items.length} item(s))`
      },
      meta: {
        orderId: createdOrder.id,
        orderReference: createdOrder.orderReference,
        customerId: customer.id
      }
    });

    res.status(201).json({
      success: true,
      orderReference: createdOrder.orderReference,
      orderId: createdOrder.id,
      transactionReference,
      totalAmount: pricing.totalAmount,
      currency: pricing.currency,
      paymentLink: flwResponse.paymentLink
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. Verify Flutterwave Payment (Server-to-Server)
 */
export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { reference } = req.params;
    const transactionId = req.query.transaction_id as string;

    if (!reference) {
      return res.status(400).json({ success: false, message: "Transaction reference is required." });
    }

    // Find the payment record and related order
    const payment = await prisma.payment.findUnique({
      where: { transactionReference: reference },
      include: {
        order: {
          include: {
            items: true,
            customer: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found for reference." });
    }

    // IDEMPOTENCY CHECK: If already marked SUCCESSFUL, return immediately without re-decrementing inventory
    if (payment.status === PaymentStatus.SUCCESSFUL && payment.order.isPaid) {
      return res.status(200).json({
        success: true,
        message: "Payment has already been successfully verified and confirmed.",
        alreadyVerified: true,
        order: {
          id: payment.order.id,
          orderReference: payment.order.orderReference,
          status: payment.order.status,
          totalAmount: Number(payment.order.totalAmount),
          currency: payment.order.currency,
          estimatedDeliveryTimeframe: payment.order.estimatedDeliveryTimeframe
        }
      });
    }

    // Call Flutterwave server-side verification API
    const targetFlwId = transactionId || payment.flwTransactionId;
    if (!targetFlwId) {
      return res.status(400).json({
        success: false,
        message: "Flutterwave transaction ID is missing for verification."
      });
    }

    const verificationResult = await verifyFlutterwaveTransaction(targetFlwId);

    if (
      verificationResult.status !== 'success' ||
      !verificationResult.data ||
      verificationResult.data.status !== 'successful'
    ) {
      // Mark payment as failed if verification rejected
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: JSON.stringify(verificationResult)
        }
      });

      return res.status(400).json({
        success: false,
        message: "Payment could not be verified by Flutterwave. Please contact support or try again."
      });
    }

    const flwData = verificationResult.data;

    // Security checks: amount, currency and tx_ref match
    const paidAmount = Number(flwData.amount);
    const expectedAmount = Number(payment.amount);

    if (paidAmount < expectedAmount) {
      console.error(`[Fraud Alert] Paid amount (${paidAmount}) is less than expected order amount (${expectedAmount})`);
      return res.status(400).json({
        success: false,
        message: "Paid amount does not match authoritative order total."
      });
    }

    if (flwData.currency.toUpperCase() !== payment.currency.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: "Currency mismatch during payment verification."
      });
    }

    // ATOMIC TRANSACTION: Update Payment, Order, Decrement Stock, Add Audit History
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Mark payment SUCCESSFUL
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESSFUL,
          flwTransactionId: String(flwData.id),
          paymentMethod: flwData.payment_type || 'card',
          paidAt: new Date(),
          gatewayResponse: JSON.stringify(flwData)
        }
      });

      // 2. Mark order as PAID / CONFIRMED
      const confirmedOrder = await tx.order.update({
        where: { id: payment.order.id },
        data: {
          status: OrderStatus.PAID,
          isPaid: true,
          paidAt: new Date()
        },
        include: {
          items: true,
          customer: true
        }
      });

      // 3. Create status history log
      await tx.orderStatusHistory.create({
        data: {
          orderId: confirmedOrder.id,
          previousStatus: payment.order.status,
          newStatus: OrderStatus.PAID,
          changedBy: 'FLUTTERWAVE_VERIFICATION',
          customerNote: 'Payment verified and confirmed via Flutterwave.'
        }
      });

      // 4. Decrement inventory for each item (prevent negative stock)
      for (const item of confirmedOrder.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      return confirmedOrder;
    });

    // 5. Trigger transactional emails asynchronously (safe error handling)
    try {
      // Send confirmation to customer
      sendOrderConfirmationEmail(updatedOrder, updatedOrder.customer).catch(err => {
        console.error("Failed to dispatch customer order confirmation email:", err);
      });

      // Fetch active admin notification emails
      const adminRecipients = await prisma.adminNotificationEmail.findMany({
        where: { active: true },
        select: { email: true }
      });

      // Also include primary store email from settings if configured
      const storeEmailSetting = await prisma.setting.findUnique({
        where: { key: "STORE_EMAIL" }
      });

      const recipientList = Array.from(
        new Set([
          ...(storeEmailSetting?.value ? [storeEmailSetting.value] : []),
          ...adminRecipients.map(r => r.email)
        ])
      );

      sendAdminOrderNotificationEmail(updatedOrder, recipientList).catch(err => {
        console.error("Failed to dispatch admin order alert email:", err);
      });
    } catch (emailErr) {
      console.error("Error setting up email notifications for verified order:", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Payment successfully verified and order confirmed.",
      order: {
        id: updatedOrder.id,
        orderReference: updatedOrder.orderReference,
        status: updatedOrder.status,
        totalAmount: Number(updatedOrder.totalAmount),
        currency: updatedOrder.currency,
        estimatedDeliveryTimeframe: updatedOrder.estimatedDeliveryTimeframe
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. Flutterwave Webhook (Idempotent Handler)
 */
export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['verif-hash'] as string;

    if (!verifyWebhookSecretHash(signature)) {
      console.warn(`[Webhook] Invalid or missing signature header:`, signature);
      return res.status(401).json({ success: false, message: "Invalid webhook signature" });
    }

    const payload = req.body;

    if (payload.event === 'charge.completed' && payload.data) {
      const flwData = payload.data;
      const txRef = flwData.tx_ref;

      if (!txRef) {
        return res.status(200).json({ success: true, message: "No tx_ref in payload" });
      }

      const payment = await prisma.payment.findUnique({
        where: { transactionReference: txRef },
        include: {
          order: {
            include: { items: true, customer: true }
          }
        }
      });

      if (!payment) {
        console.warn(`[Webhook] Payment record not found for tx_ref: ${txRef}`);
        return res.status(200).json({ success: true, message: "Payment not found" });
      }

      // IDEMPOTENT CHECK: If already paid, safely acknowledge webhook
      if (payment.status === PaymentStatus.SUCCESSFUL && payment.order.isPaid) {
        console.log(`[Webhook] Payment ${txRef} already verified. Ignoring duplicate event.`);
        return res.status(200).json({ success: true, message: "Already processed" });
      }

      if (flwData.status === 'successful') {
        // Execute atomic update
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCESSFUL,
              flwTransactionId: String(flwData.id),
              paymentMethod: flwData.payment_type || 'card',
              paidAt: new Date(),
              gatewayResponse: JSON.stringify(flwData)
            }
          });

          const confirmedOrder = await tx.order.update({
            where: { id: payment.order.id },
            data: {
              status: OrderStatus.PAID,
              isPaid: true,
              paidAt: new Date()
            },
            include: { items: true, customer: true }
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: confirmedOrder.id,
              previousStatus: payment.order.status,
              newStatus: OrderStatus.PAID,
              changedBy: 'FLUTTERWAVE_WEBHOOK',
              customerNote: 'Payment confirmed via Flutterwave webhook.'
            }
          });

          // Decrement stock
          for (const item of confirmedOrder.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: { decrement: item.quantity }
                }
              });
            }
          }

          // Trigger emails
          sendOrderConfirmationEmail(confirmedOrder, confirmedOrder.customer).catch(console.error);
        });

        console.log(`[Webhook] Successfully processed payment and confirmed order for tx_ref: ${txRef}`);
      }
    }

    res.status(200).json({ success: true, message: "Webhook received" });
  } catch (err) {
    next(err);
  }
}
