import { Request, Response, NextFunction } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin: Retrieve all registered customers with metrics
 */
export async function adminGetCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        marketingOptIn: true,
        createdAt: true,
        lastLoginAt: true,
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.CONFIRMED,
                OrderStatus.IN_PRODUCTION,
                OrderStatus.READY_FOR_SHIPPING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED
              ]
            }
          },
          select: {
            id: true,
            totalAmount: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format metrics per customer
    const formattedCustomers = customers.map(c => {
      const totalPaidOrders = c.orders.length;
      const totalSpend = c.orders.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
      const lastOrderDate = c.orders.length > 0 ? c.orders[0].createdAt : null;

      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        isEmailVerified: c.isEmailVerified,
        marketingOptIn: c.marketingOptIn,
        createdAt: c.createdAt,
        lastLoginAt: c.lastLoginAt,
        totalPaidOrders,
        totalSpend,
        lastOrderDate
      };
    });

    res.status(200).json({
      success: true,
      customers: formattedCustomers
    });
  } catch (err) {
    next(err);
  }
}
