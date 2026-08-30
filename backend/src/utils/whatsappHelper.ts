import { Order, OrderItem, CustomRequest } from '@prisma/client';

/**
 * Reusable utility for formatting currencies.
 */
export function formatCurrency(amount: number | string | Decimal): string {
  const parsed = typeof amount === 'object' ? Number(amount.toString()) : Number(amount);
  return '₦' + parsed.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Simple fallback for type definitions when Decimal is returned from Prisma
type Decimal = { toString(): string };

/**
 * Builds the URL-encoded link to open WhatsApp with a prefilled message.
 */
export function generateWhatsAppUrl(businessNumber: string, message: string): string {
  // Remove any non-numeric symbols like spaces, +, -, etc.
  const cleanedPhone = businessNumber.replace(/\D/g, '');
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Formats a WhatsApp message template for standard checkouts.
 */
export function formatOrderWhatsAppMessage(
  order: Order & { items: OrderItem[] }
): string {
  let message = `Hello ARGYR,\n\n`;
  message += `I would like to place an order for the following:\n\n`;

  order.items.forEach((item, index) => {
    message += `${index + 1}. ${item.productName}\n`;
    message += `   Size: ${item.selectedSize}\n`;
    if (item.selectedColour) {
      message += `   Colour: ${item.selectedColour}\n`;
    }
    message += `   Quantity: ${item.quantity}\n`;
    message += `   Unit Price: ${formatCurrency(item.unitPrice)}\n`;
    message += `   Estimated Subtotal: ${formatCurrency(item.estimatedSubtotal)}\n\n`;
  });

  message += `Estimated Total: ${formatCurrency(order.estimatedTotal)}\n\n`;
  message += `Customer Name: ${order.customerName}\n`;
  message += `WhatsApp: ${order.customerPhone}\n`;
  if (order.customerEmail) {
    message += `Email: ${order.customerEmail}\n`;
  }
  message += `Delivery Location: ${order.deliveryCity}, ${order.deliveryCountry}\n`;
  message += `Address: ${order.deliveryAddress}\n`;
  if (order.notes) {
    message += `Notes: ${order.notes}\n`;
  }
  message += `\nOrder Reference: ${order.orderReference}\n\n`;
  message += `I would like to confirm availability and discuss payment and delivery.\n\n`;
  message += `Thank you.`;

  return message;
}

/**
 * Formats a WhatsApp message template for custom shoe consultations.
 */
export function formatCustomRequestWhatsAppMessage(
  request: CustomRequest,
  referenceProductName: string | null
): string {
  let message = `Hello ARGYR,\n\n`;
  message += `I would like to discuss a custom shoe request.\n\n`;

  if (referenceProductName) {
    message += `Reference Shoe: ${referenceProductName}\n`;
  }
  message += `Category: ${request.categoryName}\n`;
  message += `Gender: ${request.gender}\n`;
  message += `Size: ${request.shoeSize}\n`;
  message += `Preferred Colour: ${request.preferredColour}\n`;
  message += `Preferred Material: ${request.preferredMaterial}\n`;
  message += `Quantity: ${request.quantity} pair(s)\n\n`;

  message += `Customisation Request:\n"${request.description}"\n\n`;
  
  if (request.additionalNotes) {
    message += `Additional Notes:\n"${request.additionalNotes}"\n\n`;
  }

  message += `Customer Name: ${request.customerName}\n`;
  message += `WhatsApp: ${request.customerPhone}\n`;
  message += `Location: ${request.city}, ${request.country}\n`;
  message += `\nRequest Reference: ${request.requestReference}\n\n`;
  message += `I have submitted reference images through the website. Please let me know if this can be created and the estimated price.\n\n`;
  message += `Thank you.`;

  return message;
}
