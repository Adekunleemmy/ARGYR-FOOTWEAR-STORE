import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateOrderPricing } from '../services/pricingService';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mPrisma = {
    product: {
      findMany: vi.fn(),
    },
    shippingMethod: {
      findUnique: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrisma) };
});

describe('Pricing & Shipping Calculations', () => {
  const prismaMock = new PrismaClient() as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate item subtotal and authoritative shipping total correctly', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'ARGYR Chelsea Boot',
        sku: 'ARG-BOOT-01',
        price: '85000.00',
        bulkPrice: '75000.00',
        bulkMinimumQuantity: 5,
        stockQuantity: 10,
        status: 'ACTIVE',
        images: [{ url: 'https://example.com/boot.jpg' }]
      }
    ]);

    prismaMock.shippingMethod.findUnique.mockResolvedValue({
      id: 'ship-lagos',
      name: 'Lagos Mainland',
      price: '6000.00',
      currency: 'NGN',
      active: true
    });

    const result = await calculateOrderPricing(
      [{ productId: 'prod-1', quantity: 2 }],
      'ship-lagos'
    );

    expect(result.subtotal).toBe(170000); // 85,000 * 2
    expect(result.shippingCost).toBe(6000);
    expect(result.shippingMethodName).toBe('Lagos Mainland');
    expect(result.totalAmount).toBe(176000);
    expect(result.items[0].imageUrl).toBe('https://example.com/boot.jpg');
    expect(result.items[0].isBulkApplied).toBe(false);
  });

  it('should apply bulk discount AND calculate shipping', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'ARGYR Chelsea Boot',
        sku: 'ARG-BOOT-01',
        price: '85000.00',
        bulkPrice: '75000.00',
        bulkMinimumQuantity: 5,
        stockQuantity: 20,
        status: 'ACTIVE',
        images: []
      }
    ]);

    prismaMock.shippingMethod.findUnique.mockResolvedValue({
      id: 'ship-outside',
      name: 'Nigeria — Outside Lagos',
      price: '10000.00',
      currency: 'NGN',
      active: true
    });

    const result = await calculateOrderPricing(
      [{ productId: 'prod-1', quantity: 5 }],
      'ship-outside'
    );

    expect(result.subtotal).toBe(375000); // 75,000 * 5 (bulk price applied)
    expect(result.shippingCost).toBe(10000);
    expect(result.totalAmount).toBe(385000);
    expect(result.items[0].isBulkApplied).toBe(true);
  });

  it('should reject ordering if requested quantity exceeds available stock', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'ARGYR Chelsea Boot',
        sku: 'ARG-BOOT-01',
        price: '85000.00',
        stockQuantity: 2,
        status: 'ACTIVE',
        images: []
      }
    ]);

    await expect(
      calculateOrderPricing([{ productId: 'prod-1', quantity: 5 }])
    ).rejects.toThrow(/Insufficient stock for "ARGYR Chelsea Boot"/);
  });

  it('should reject ordering if product is draft or archived', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 'prod-archived',
        name: 'Old Loafer',
        sku: 'ARG-OLD-01',
        price: '50000.00',
        stockQuantity: 10,
        status: 'ARCHIVED',
        images: []
      }
    ]);

    await expect(
      calculateOrderPricing([{ productId: 'prod-archived', quantity: 1 }])
    ).rejects.toThrow(/not available for purchase/);
  });

  it('should reject inactive shipping methods', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'ARGYR Sneaker',
        sku: 'ARG-SNK-01',
        price: '60000.00',
        stockQuantity: 10,
        status: 'ACTIVE',
        images: []
      }
    ]);

    prismaMock.shippingMethod.findUnique.mockResolvedValue({
      id: 'ship-inactive',
      name: 'Disabled Region',
      price: '5000.00',
      active: false
    });

    await expect(
      calculateOrderPricing([{ productId: 'prod-1', quantity: 1 }], 'ship-inactive')
    ).rejects.toThrow(/Selected shipping method is not available or inactive/);
  });
});
