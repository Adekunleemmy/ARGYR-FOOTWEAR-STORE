import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ProductStatus, OrderStatus, CustomRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin: Retrieve dashboard statistics and recent activity logs
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      newOrders,
      pendingCustomRequests,
      completedOrders,
      recentOrders,
      recentCustomRequests
    ] = await Promise.all([
      // Count products excluding archived soft-deletes
      prisma.product.count({ where: { status: { not: ProductStatus.ARCHIVED } } }),
      prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      prisma.product.count({ where: { status: ProductStatus.OUT_OF_STOCK } }),
      
      // Count order and custom request queues
      prisma.order.count({ where: { status: OrderStatus.NEW } }),
      prisma.customRequest.count({ where: { status: { in: [CustomRequestStatus.NEW, CustomRequestStatus.REVIEWING] } } }),
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      
      // Fetch recent order logs
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Fetch recent custom shoe requests
      prisma.customRequest.findMany({
        take: 5,
        include: { referenceProduct: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        newOrders,
        pendingCustomRequests,
        completedOrders
      },
      recentOrders,
      recentCustomRequests
    });
  } catch (err) {
    next(err);
  }
}
