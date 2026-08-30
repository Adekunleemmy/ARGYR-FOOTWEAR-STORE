import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PricingResultItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  regularPrice: number;
  bulkPrice: number | null;
  bulkMinimumQuantity: number;
  appliedUnitPrice: number;
  estimatedSubtotal: number;
  isBulkApplied: boolean;
}

export interface PricingResult {
  items: PricingResultItem[];
  subtotal: number;
  estimatedTotal: number;
}

/**
 * Calculates authoritative pricing on the server based on product rules.
 * Prevents client-side price spoofing.
 */
export async function calculateOrderPricing(
  items: Array<{ productId: string; quantity: number }>
): Promise<PricingResult> {
  const pricingItems: PricingResultItem[] = [];
  let calculatedSubtotal = 0;

  // Retrieve products from DB to verify active status and secure pricing details
  const productIds = items.map(item => item.productId);
  const dbProducts = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: {
        in: ['ACTIVE', 'OUT_OF_STOCK'] // Allow ordering if out of stock but will alert admin
      }
    }
  });

  for (const item of items) {
    const dbProduct = dbProducts.find(p => p.id === item.productId);
    if (!dbProduct) {
      throw new Error(`Product with ID ${item.productId} was not found or is currently archived/draft.`);
    }

    const regularPrice = Number(dbProduct.price);
    const bulkPrice = dbProduct.bulkPrice ? Number(dbProduct.bulkPrice) : null;
    const bulkMinimumQuantity = dbProduct.bulkMinimumQuantity;

    let appliedUnitPrice = regularPrice;
    let isBulkApplied = false;

    // Apply bulk pricing logic
    if (bulkPrice !== null && item.quantity >= bulkMinimumQuantity) {
      appliedUnitPrice = bulkPrice;
      isBulkApplied = true;
    }

    const estimatedSubtotal = appliedUnitPrice * item.quantity;
    calculatedSubtotal += estimatedSubtotal;

    pricingItems.push({
      productId: dbProduct.id,
      name: dbProduct.name,
      sku: dbProduct.sku,
      quantity: item.quantity,
      regularPrice,
      bulkPrice,
      bulkMinimumQuantity,
      appliedUnitPrice,
      estimatedSubtotal,
      isBulkApplied
    });
  }

  return {
    items: pricingItems,
    subtotal: calculatedSubtotal,
    estimatedTotal: calculatedSubtotal // No shipping auto-calculated; to be finalized on WhatsApp
  };
}
