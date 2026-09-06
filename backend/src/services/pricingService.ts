import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PricingResultItem {
  productId: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  regularPrice: number;
  bulkPrice: number | null;
  bulkMinimumQuantity: number;
  appliedUnitPrice: number;
  subtotal: number;
  isBulkApplied: boolean;
}

export interface PricingResult {
  items: PricingResultItem[];
  subtotal: number;
  shippingCost: number;
  shippingMethodName: string | null;
  totalAmount: number;
  estimatedTotal: number;
  currency: string;
}

/**
 * Calculates authoritative pricing on the server based on product rules, bulk tiers, and shipping method.
 * Prevents any client-side price or total spoofing.
 */
export async function calculateOrderPricing(
  items: Array<{ productId: string; quantity: number }>,
  shippingMethodId?: string
): Promise<PricingResult> {
  const pricingItems: PricingResultItem[] = [];
  let calculatedSubtotal = 0;

  // Retrieve products from DB including their primary image
  const productIds = items.map(item => item.productId);
  const dbProducts = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1
      }
    }
  });

  for (const item of items) {
    const dbProduct = dbProducts.find(p => p.id === item.productId);
    if (!dbProduct) {
      throw new Error(`Product with ID ${item.productId} was not found or is no longer available.`);
    }

    if (dbProduct.status === 'ARCHIVED' || dbProduct.status === 'DRAFT') {
      throw new Error(`The product "${dbProduct.name}" is currently not available for purchase.`);
    }

    // Check stock availability
    if (dbProduct.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stockQuantity} pair(s) currently available.`);
    }

    const regularPrice = Number(dbProduct.price);
    const bulkPrice = dbProduct.bulkPrice ? Number(dbProduct.bulkPrice) : null;
    const bulkMinimumQuantity = dbProduct.bulkMinimumQuantity;

    let appliedUnitPrice = regularPrice;
    let isBulkApplied = false;

    // Apply bulk pricing logic if eligible
    if (bulkPrice !== null && item.quantity >= bulkMinimumQuantity) {
      appliedUnitPrice = bulkPrice;
      isBulkApplied = true;
    }

    const itemSubtotal = appliedUnitPrice * item.quantity;
    calculatedSubtotal += itemSubtotal;

    pricingItems.push({
      productId: dbProduct.id,
      name: dbProduct.name,
      sku: dbProduct.sku,
      imageUrl: (dbProduct as any).images?.[0]?.url || null,
      quantity: item.quantity,
      regularPrice,
      bulkPrice,
      bulkMinimumQuantity,
      appliedUnitPrice,
      subtotal: itemSubtotal,
      isBulkApplied
    });
  }

  // Calculate authoritative shipping cost
  let shippingCost = 0;
  let shippingMethodName: string | null = null;
  let currency = "NGN";

  if (shippingMethodId) {
    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: { id: shippingMethodId }
    });

    if (!shippingMethod || !shippingMethod.active) {
      throw new Error("Selected shipping method is not available or inactive.");
    }

    shippingCost = Number(shippingMethod.price);
    shippingMethodName = shippingMethod.name;
    currency = shippingMethod.currency || "NGN";
  }

  const authoritativeTotal = calculatedSubtotal + shippingCost;

  return {
    items: pricingItems,
    subtotal: calculatedSubtotal,
    shippingCost,
    shippingMethodName,
    totalAmount: authoritativeTotal,
    estimatedTotal: authoritativeTotal,
    currency
  };
}
