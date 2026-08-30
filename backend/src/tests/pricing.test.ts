import { describe, it, expect, vi, beforeEach } from 'vitest';

// Declare mock functions inside the hoisted vi.mock factory and export them
vi.mock('@prisma/client', () => {
  const mockFindMany = vi.fn();
  
  return {
    PrismaClient: class {
      product = {
        findMany: mockFindMany
      };
    },
    // Export the mock spy so it is importable in the test
    _mockFindMany: mockFindMany
  };
});

// @ts-ignore
import { _mockFindMany } from '@prisma/client';
import { calculateOrderPricing } from '../services/pricingService';

describe('Pricing Service - calculateOrderPricing', () => {
  beforeEach(() => {
    (_mockFindMany as any).mockReset();
  });

  it('should apply standard price when quantity is below bulk threshold', async () => {
    (_mockFindMany as any).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'ARGYR Noir Runner',
        sku: 'ARG-SNE-001',
        price: '85000.00',
        bulkPrice: '75000.00',
        bulkMinimumQuantity: 10,
        status: 'ACTIVE'
      }
    ]);

    const result = await calculateOrderPricing([
      { productId: 'prod-1', quantity: 2 }
    ]);

    expect(result.subtotal).toBe(170000);
    expect(result.items[0].appliedUnitPrice).toBe(85000);
    expect(result.items[0].isBulkApplied).toBe(false);
  });

  it('should apply discounted bulk price when quantity meets or exceeds threshold', async () => {
    (_mockFindMany as any).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'ARGYR Noir Runner',
        sku: 'ARG-SNE-001',
        price: '85000.00',
        bulkPrice: '75000.00',
        bulkMinimumQuantity: 10,
        status: 'ACTIVE'
      }
    ]);

    const result = await calculateOrderPricing([
      { productId: 'prod-1', quantity: 12 }
    ]);

    expect(result.subtotal).toBe(900000); // 75,000 * 12
    expect(result.items[0].appliedUnitPrice).toBe(75000);
    expect(result.items[0].isBulkApplied).toBe(true);
  });

  it('should fallback to standard price if bulkPrice is null despite quantity threshold met', async () => {
    (_mockFindMany as any).mockResolvedValue([
      {
        id: 'prod-2',
        name: 'ARGYR Atelier Oxford',
        sku: 'ARG-FOR-002',
        price: '120000.00',
        bulkPrice: null,
        bulkMinimumQuantity: 5,
        status: 'ACTIVE'
      }
    ]);

    const result = await calculateOrderPricing([
      { productId: 'prod-2', quantity: 8 }
    ]);

    expect(result.subtotal).toBe(960000); // 120,000 * 8
    expect(result.items[0].appliedUnitPrice).toBe(120000);
    expect(result.items[0].isBulkApplied).toBe(false);
  });
});
