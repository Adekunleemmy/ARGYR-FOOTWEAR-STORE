import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

// Initialize nodemailer transporter if configured
let transporter: Transporter | null = null;

if (config.EMAIL.isConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: config.EMAIL.SMTP_HOST,
      port: config.EMAIL.SMTP_PORT,
      secure: config.EMAIL.SMTP_SECURE,
      auth: {
        user: config.EMAIL.SMTP_USER,
        pass: config.EMAIL.SMTP_PASS,
      },
    });
    console.log(`📧 Email Service: SMTP configured (${config.EMAIL.SMTP_HOST}:${config.EMAIL.SMTP_PORT})`);
  } catch (err: any) {
    console.error(`⚠️ Email Service: Failed to initialize SMTP transporter:`, err.message);
    transporter = null;
  }
} else {
  console.log(`ℹ️ Email Service: SMTP not configured. Transactional emails will be logged to console.`);
}

/**
 * Base helper to send an email with fallback logging
 */
async function sendMail(options: { to: string | string[]; subject: string; html: string; text?: string }) {
  const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: config.EMAIL.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      });
      console.log(`✅ Email sent to [${recipients}] - ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error(`❌ Failed to send email to [${recipients}]:`, error.message);
      // Fall through to simulated log so email failure never crashes checkout/order
      return { success: false, error: error.message };
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`📧 [TRANSACTIONAL EMAIL SIMULATION]`);
    console.log(`To: ${recipients}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`------------------------------------------------------`);
    console.log(options.text || "See HTML content");
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }
}

/**
 * Common email layout wrapper with ARGYR luxury branding
 */
function brandLayout(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f5f5f5;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #121212;
      border: 1px solid #262626;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      padding: 36px 32px 24px;
      background-color: #000000;
      border-bottom: 1px solid #262626;
      text-align: center;
    }
    .brand {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.35em;
      color: #ffffff;
      text-transform: uppercase;
      text-decoration: none;
    }
    .tagline {
      font-size: 10px;
      letter-spacing: 0.25em;
      color: #a3a3a3;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .body {
      padding: 36px 32px;
      color: #d4d4d4;
      line-height: 1.6;
      font-size: 14px;
    }
    .footer {
      padding: 24px 32px;
      background-color: #0a0a0a;
      border-top: 1px solid #1f1f1f;
      text-align: center;
      font-size: 11px;
      color: #737373;
      letter-spacing: 0.05em;
    }
    .footer a {
      color: #a3a3a3;
      text-decoration: none;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background-color: #ffffff;
      color: #000000 !important;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      border-radius: 2px;
      margin-top: 24px;
    }
    .otp-code {
      font-family: 'Courier New', monospace;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 0.25em;
      color: #ffffff;
      background: #1a1a1a;
      border: 1px solid #333;
      padding: 16px 24px;
      text-align: center;
      margin: 24px 0;
      border-radius: 4px;
    }
    .order-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .order-table th {
      text-align: left;
      padding: 10px 0;
      border-bottom: 1px solid #262626;
      color: #888;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .order-table td {
      padding: 12px 0;
      border-bottom: 1px solid #1a1a1a;
    }
    .total-row {
      font-weight: bold;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">ARGYR</div>
      <div class="tagline">Premium Footwear Platform</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ARGYR FOOTWEAR. Handcrafted Distinction.</p>
      <p>Questions? Reach our concierge directly via WhatsApp or reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 1. Customer OTP verification email
 */
export async function sendOtpEmail(to: string, firstName: string, otp: string) {
  const content = `
    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; letter-spacing: 0.05em;">Verify Your Email</h2>
    <p>Dear ${firstName || 'Valued Customer'},</p>
    <p>Welcome to ARGYR. Please enter the verification code below to complete your registration and secure your customer account.</p>
    
    <div class="otp-code">${otp}</div>
    
    <p style="font-size: 12px; color: #888;">This code is valid for <strong>15 minutes</strong> and can only be used once. If you did not initiate this request, you can safely ignore this message.</p>
  `;

  return sendMail({
    to,
    subject: `ARGYR - Your Verification Code: ${otp}`,
    html: brandLayout("Verify Your Email", content),
    text: `Hello ${firstName},\n\nYour ARGYR verification code is: ${otp}\n\nThis code expires in 15 minutes.`,
  });
}

/**
 * 2. Customer Password Reset email
 */
export async function sendPasswordResetEmail(to: string, firstName: string, resetToken: string) {
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;
  
  const content = `
    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0;">Password Reset Request</h2>
    <p>Hello ${firstName || 'Valued Customer'},</p>
    <p>We received a request to reset the password for your ARGYR customer account. Click the button below to choose a new password:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    
    <p style="font-size: 12px; color: #888;">This link will expire in <strong>1 hour</strong>. If you did not request a password reset, your account remains secure and no action is required.</p>
    <p style="font-size: 11px; color: #666; word-break: break-all;">Link: ${resetUrl}</p>
  `;

  return sendMail({
    to,
    subject: `ARGYR - Password Reset Request`,
    html: brandLayout("Password Reset", content),
    text: `Hello ${firstName},\n\nPlease use the following link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}

/**
 * 3. Customer Order Confirmation email
 */
export async function sendOrderConfirmationEmail(order: any, customer: any) {
  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td>
          <strong style="color: #fff;">${item.productName}</strong><br>
          <span style="font-size: 11px; color: #888;">Size: ${item.selectedSize} ${item.selectedColour ? `| Colour: ${item.selectedColour}` : ''}</span>
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">₦${Number(item.unitPrice).toLocaleString()}</td>
        <td style="text-align: right; color: #fff;">₦${Number(item.subtotal || item.estimatedSubtotal).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const orderUrl = `${config.FRONTEND_URL}/account/orders/${order.id}`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0;">Order Confirmed</h2>
    <p>Dear ${customer?.firstName || order.customerName},</p>
    <p>Thank you for choosing ARGYR. Your order has been placed and your payment has been successfully confirmed.</p>
    
    <div style="background: #171717; padding: 16px 20px; border-left: 2px solid #ffffff; margin: 24px 0;">
      <div style="font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.1em;">Order Reference</div>
      <div style="font-size: 18px; font-weight: 700; color: #fff; font-family: monospace;">${order.orderReference}</div>
      <div style="font-size: 12px; color: #aaa; margin-top: 6px;">Estimated Delivery: <strong>${order.estimatedDeliveryTimeframe || '7–14 days'}</strong></div>
    </div>

    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #ffffff; margin-top: 28px;">Purchased Items</h3>
    <table class="order-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align: right; padding-top: 12px;">Subtotal:</td>
          <td style="text-align: right; padding-top: 12px;">₦${Number(order.subtotal).toLocaleString()}</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right;">Shipping (${order.shippingMethodName || 'Standard'}):</td>
          <td style="text-align: right;">₦${Number(order.shippingCost || 0).toLocaleString()}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3" style="text-align: right; font-size: 15px; border-top: 1px solid #333; padding-top: 10px;">Total Paid:</td>
          <td style="text-align: right; font-size: 15px; border-top: 1px solid #333; padding-top: 10px; color: #fff;">₦${Number(order.totalAmount || order.estimatedTotal).toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #ffffff; margin-top: 28px;">Delivery Details</h3>
    <p style="font-size: 13px; line-height: 1.5; color: #ccc;">
      ${order.customerName}<br>
      ${order.deliveryAddress}<br>
      ${order.deliveryCity}${order.deliveryState ? `, ${order.deliveryState}` : ''}, ${order.deliveryCountry}<br>
      ${order.customerPhone}
    </p>

    <div style="text-align: center; margin: 36px 0 16px;">
      <a href="${orderUrl}" class="btn">Track Your Order</a>
    </div>
  `;

  return sendMail({
    to: customer?.email || order.customerEmail,
    subject: `Order Confirmation - ${order.orderReference}`,
    html: brandLayout(`Order Confirmation: ${order.orderReference}`, content),
    text: `Thank you for your order ${order.orderReference}. Your payment of ₦${Number(order.totalAmount).toLocaleString()} has been confirmed. Track your order at: ${orderUrl}`,
  });
}

/**
 * 4. Admin Order Notification email
 */
export async function sendAdminOrderNotificationEmail(order: any, recipients: string[]) {
  if (!recipients || recipients.length === 0) return;

  const adminOrderUrl = `${config.FRONTEND_URL}/admin/dashboard/orders`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0;">New Paid Purchase Alert</h2>
    <p>A customer has successfully completed payment for order <strong>${order.orderReference}</strong>.</p>
    
    <div style="background: #171717; padding: 16px 20px; border-left: 2px solid #22c55e; margin: 20px 0;">
      <div style="font-size: 12px; color: #aaa;">Total Received: <strong style="color: #fff; font-size: 16px;">₦${Number(order.totalAmount).toLocaleString()}</strong> (${order.currency})</div>
      <div style="font-size: 12px; color: #aaa;">Customer: <strong style="color: #fff;">${order.customerName}</strong> (${order.customerEmail || 'No email'})</div>
      <div style="font-size: 12px; color: #aaa;">Phone: <strong style="color: #fff;">${order.customerPhone}</strong></div>
      <div style="font-size: 12px; color: #aaa;">Delivery: ${order.deliveryCity}, ${order.deliveryCountry} (${order.shippingMethodName || 'Standard'})</div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${adminOrderUrl}" class="btn">Open Admin Console</a>
    </div>
  `;

  return sendMail({
    to: recipients,
    subject: `[NEW ORDER] ${order.orderReference} - ₦${Number(order.totalAmount).toLocaleString()} - ${order.customerName}`,
    html: brandLayout("New Order Notification", content),
    text: `New order ${order.orderReference} paid: ₦${Number(order.totalAmount).toLocaleString()} by ${order.customerName}.`,
  });
}

/**
 * 5. Customer Order Status Update email
 */
export async function sendOrderStatusUpdateEmail(order: any, customer: any, newStatus: string, customerNote?: string) {
  const statusLabels: Record<string, string> = {
    IN_PRODUCTION: "In Production",
    READY_FOR_SHIPPING: "Ready for Shipping",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded"
  };

  const statusDisplay = statusLabels[newStatus] || newStatus;
  const orderUrl = `${config.FRONTEND_URL}/account/orders/${order.id}`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0;">Order Status Update</h2>
    <p>Dear ${customer?.firstName || order.customerName},</p>
    <p>Your ARGYR order <strong>${order.orderReference}</strong> has progressed to a new stage:</p>
    
    <div style="background: #171717; padding: 20px; border-left: 2px solid #ffffff; margin: 24px 0; text-align: center;">
      <div style="font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.2em;">Current Stage</div>
      <div style="font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 6px; letter-spacing: 0.05em;">${statusDisplay}</div>
      ${customerNote ? `<div style="font-size: 13px; color: #ccc; margin-top: 12px; font-style: italic;">"${customerNote}"</div>` : ''}
    </div>

    <p style="font-size: 13px; color: #aaa;">You can track real-time progress and view complete specifications directly from your customer account.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${orderUrl}" class="btn">View Order Details</a>
    </div>
  `;

  return sendMail({
    to: customer?.email || order.customerEmail,
    subject: `Update on your ARGYR order ${order.orderReference}: ${statusDisplay}`,
    html: brandLayout(`Order Status Update: ${statusDisplay}`, content),
    text: `Your order ${order.orderReference} is now ${statusDisplay}. Track it at: ${orderUrl}`,
  });
}
