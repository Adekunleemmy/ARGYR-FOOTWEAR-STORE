import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { ShippingMethodUpdateSchema } from '../schemas/zodSchemas';
import { withCache, invalidateCache } from '../utils/cache';

/**
 * Public: Fetch available active shipping methods (Cached for 120s)
 */
export async function getShippingMethods(req: Request, res: Response, next: NextFunction) {
  try {
    const shippingMethods = await withCache('shipping:methods:active', 120, async () => {
      const methods = await prisma.shippingMethod.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' }
      });

      return methods.map(m => ({
        id: m.id,
        name: m.name,
        code: m.code,
        description: m.description,
        price: Number(m.price),
        currency: m.currency
      }));
    });

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.status(200).json({
      success: true,
      shippingMethods
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Retrieve all shipping methods (active and inactive)
 */
export async function adminGetShippingMethods(req: Request, res: Response, next: NextFunction) {
  try {
    const methods = await prisma.shippingMethod.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    res.status(200).json({
      success: true,
      shippingMethods: methods
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update shipping method fee, name, description, active status
 */
export async function adminUpdateShippingMethod(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = ShippingMethodUpdateSchema.parse(req.body);

    const updated = await prisma.shippingMethod.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price,
        currency: data.currency,
        active: data.active,
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {})
      }
    });

    // Invalidate public shipping cache
    invalidateCache('shipping:');

    res.status(200).json({
      success: true,
      message: `Shipping region "${updated.name}" updated successfully.`,
      shippingMethod: updated
    });
  } catch (err) {
    next(err);
  }
}

