import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CategorySchema } from '../schemas/zodSchemas';

const prisma = new PrismaClient();

/**
 * Public: Retrieve active categories ordered by sortOrder
 */
export async function getActiveCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Retrieve all categories
 */
export async function getAllCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Create a new category
 */
export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CategorySchema.parse(req.body);
    
    // Check if slug is unique
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Slug is already in use" });
    }

    const category = await prisma.category.create({ data });
    res.status(201).json({ success: true, message: "Category created successfully", category });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update existing category details
 */
export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = CategorySchema.parse(req.body);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Check slug collision
    if (data.slug !== existing.slug) {
      const slugCollision = await prisma.category.findUnique({ where: { slug: data.slug } });
      if (slugCollision) {
        return res.status(400).json({ success: false, message: "Slug is already in use" });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data
    });

    res.status(200).json({ success: true, message: "Category updated successfully", category });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Delete a category (if it contains no products)
 */
export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Reject if products reference this category
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is referenced by ${productsCount} active products.`
      });
    }

    await prisma.category.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    next(err);
  }
}
