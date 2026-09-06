import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ProductStatus, OrderStatus, CustomRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin: Retrieve dashboard statistics and live ecommerce metrics
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      totalCustomers,
      paidOrdersCount,
      pendingPaymentOrdersCount,
      inProductionOrdersCount,
      shippedOrdersCount,
      deliveredOrdersCount,
      pendingCustomRequests,
      revenueAggregation,
      recentOrders,
      recentCustomRequests
    ] = await Promise.all([
      // Product counts
      prisma.product.count({ where: { status: { not: ProductStatus.ARCHIVED } } }),
      prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      prisma.product.count({ where: { status: ProductStatus.OUT_OF_STOCK } }),
      
      // Customer count
      prisma.customer.count(),

      // Order counts by ecommerce stage
      prisma.order.count({ where: { status: { in: [OrderStatus.PAID, OrderStatus.CONFIRMED] } } }),
      prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
      prisma.order.count({ where: { status: OrderStatus.IN_PRODUCTION } }),
      prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),

      // Custom shoe requests queue
      prisma.customRequest.count({
        where: { status: { in: [CustomRequestStatus.NEW, CustomRequestStatus.REVIEWING] } }
      }),

      // Authoritative paid revenue sum (verified paid / completed orders only)
      prisma.order.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.CONFIRMED,
              OrderStatus.IN_PRODUCTION,
              OrderStatus.READY_FOR_SHIPPING,
              OrderStatus.SHIPPED,
              OrderStatus.DELIVERED,
              OrderStatus.COMPLETED // legacy completed
            ]
          }
        }
      }),

      // Recent order activity
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

      // Recent custom requests
      prisma.customRequest.findMany({
        take: 5,
        include: { referenceProduct: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalPaidRevenue = Number(revenueAggregation._sum.totalAmount || 0);

    res.status(200).json({
      success: true,
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
    });
  } catch (err) {
    next(err);
  }
}
