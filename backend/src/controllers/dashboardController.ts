import { Request, Response, NextFunction } from 'express';
import { ProductStatus, OrderStatus, CustomRequestStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { withCache } from '../utils/cache';

/**
 * Admin: Retrieve dashboard statistics and live ecommerce metrics (Cached for 20s)
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await withCache('admin:dashboard:stats', 20, async () => {
      const [
        productsStatus,
        totalCustomers,
        orderStatusGroups,
        pendingCustomRequests,
        revenueAggregation,
        recentOrders,
        recentCustomRequests
      ] = await Promise.all([
        // 1. Consolidated product status count
        prisma.product.groupBy({
          by: ['status'],
          where: { status: { not: ProductStatus.ARCHIVED } },
          _count: { id: true }
        }),

        // 2. Customer count
        prisma.customer.count(),

        // 3. Consolidated order status counts (single GROUP BY query)
        prisma.order.groupBy({
          by: ['status'],
          _count: { id: true }
        }),

        // 4. Custom shoe requests queue
        prisma.customRequest.count({
          where: { status: { in: [CustomRequestStatus.NEW, CustomRequestStatus.REVIEWING] } }
        }),

        // 5. Authoritative paid revenue sum
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.CONFIRMED,
                OrderStatus.IN_PRODUCTION,
                OrderStatus.READY_FOR_SHIPPING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
                OrderStatus.COMPLETED
              ]
            }
          }
        }),

        // 6. Recent order activity
        prisma.order.findMany({
          take: 6,
          include: {
            items: true,
            customer: {
              select: { firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),

        // 7. Recent custom requests
        prisma.customRequest.findMany({
          take: 5,
          include: { referenceProduct: true },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Map product counts
      let totalProducts = 0;
      let activeProducts = 0;
      let outOfStockProducts = 0;
      for (const p of productsStatus) {
        totalProducts += p._count.id;
        if (p.status === ProductStatus.ACTIVE) activeProducts = p._count.id;
        if (p.status === ProductStatus.OUT_OF_STOCK) outOfStockProducts = p._count.id;
      }

      // Map order status counts
      const statusMap: Record<string, number> = {};
      for (const g of orderStatusGroups) {
        statusMap[g.status] = g._count.id;
      }

      const paidOrdersCount = (statusMap[OrderStatus.PAID] || 0) + (statusMap[OrderStatus.CONFIRMED] || 0);
      const pendingPaymentOrdersCount = statusMap[OrderStatus.PENDING_PAYMENT] || 0;
      const inProductionOrdersCount = statusMap[OrderStatus.IN_PRODUCTION] || 0;
      const shippedOrdersCount = statusMap[OrderStatus.SHIPPED] || 0;
      const deliveredOrdersCount = statusMap[OrderStatus.DELIVERED] || 0;

      const totalPaidRevenue = Number(revenueAggregation._sum.totalAmount || 0);

      return {
        stats: {
          totalProducts,
          activeProducts,
          outOfStockProducts,
          totalCustomers,
          totalPaidRevenue,
          paidOrdersCount,
          pendingPaymentOrdersCount,
          inProductionOrdersCount,
          shippedOrdersCount,
          deliveredOrdersCount,
          pendingCustomRequests
        },
        recentOrders,
        recentCustomRequests
      };
    });

    res.status(200).json({
      success: true,
      ...data
    });
  } catch (err) {
    next(err);
  }
}

