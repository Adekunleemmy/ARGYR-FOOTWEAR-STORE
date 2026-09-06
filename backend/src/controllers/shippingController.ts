import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ShippingMethodUpdateSchema } from '../schemas/zodSchemas';

const prisma = new PrismaClient();

/**
 * Public: Fetch available active shipping methods
 */
export async function getShippingMethods(req: Request, res: Response, next: NextFunction) {
  try {
    const methods = await prisma.shippingMethod.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' }
    });

    res.status(200).json({
      success: true,
      shippingMethods: methods.map(m => ({
        id: m.id,
        name: m.name,
        code: m.code,
        description: m.description,
        price: Number(m.price),
        currency: m.currency
      }))
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

    res.status(200).json({
      success: true,
      message: `Shipping region "${updated.name}" updated successfully.`,
      shippingMethod: updated
    });
  } catch (err) {
    next(err);
  }
}
