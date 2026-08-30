import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ProductStatus, Gender } from '@prisma/client';
import { ProductSchema } from '../schemas/zodSchemas';
import { isCloudinaryConfigured, uploadToCloudinary } from '../utils/cloudinaryHelper';

const prisma = new PrismaClient();

/**
 * Public: Browse active products with filtering, search, and sorting
 */
export async function getCatalogProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, gender, size, minPrice, maxPrice, search, sort, featured, newArrival, bestSeller } = req.query;

    const whereClause: any = {
      // Exclude DRAFT and ARCHIVED from public view
      status: { in: [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK] }
    };

    if (category) {
      whereClause.category = { slug: String(category) };
    }

    if (gender) {
      whereClause.gender = gender as Gender;
    }

    if (size) {
      whereClause.sizes = { has: String(size) };
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = Number(minPrice);
      if (maxPrice) whereClause.price.lte = Number(maxPrice);
    }

    if (featured === 'true') whereClause.featured = true;
    if (newArrival === 'true') whereClause.newArrival = true;
    if (bestSeller === 'true') whereClause.bestSeller = true;

    if (search) {
      const q = String(search);
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { material: { contains: q, mode: 'insensitive' } },
        { collection: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Handle sorting
    let orderBy: any = { createdAt: 'desc' }; // default: newest
    if (sort) {
      if (sort === 'price_asc') orderBy = { price: 'asc' };
      else if (sort === 'price_desc') orderBy = { price: 'desc' };
      else if (sort === 'name_asc') orderBy = { name: 'asc' };
      else if (sort === 'name_desc') orderBy = { name: 'desc' };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy
    });

    res.status(200).json({ success: true, products });
  } catch (err) {
    next(err);
  }
}

/**
 * Public: Get single product details by slug
 */
export async function getProductDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        slug,
        status: { in: [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK] }
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get all products (excluding soft-deleted/archived ones by default)
 */
export async function adminGetProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: { not: ProductStatus.ARCHIVED }
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, products });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Create a product
 */
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ProductSchema.parse(req.body);
    const { images, ...productData } = parsed;

    // Check slug and SKU uniqueness
    const slugCollision = await prisma.product.findUnique({ where: { slug: productData.slug } });
    if (slugCollision) {
      return res.status(400).json({ success: false, message: "Slug is already in use" });
    }

    const skuCollision = await prisma.product.findUnique({ where: { sku: productData.sku } });
    if (skuCollision) {
      return res.status(400).json({ success: false, message: "SKU is already in use" });
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: images
        }
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } }
      }
    });

    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update a product and its images
 */
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = ProductSchema.parse(req.body);
    const { images, ...productData } = parsed;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Uniqueness checks
    if (productData.slug !== existing.slug) {
      const slugCollision = await prisma.product.findUnique({ where: { slug: productData.slug } });
      if (slugCollision) {
        return res.status(400).json({ success: false, message: "Slug is already in use" });
      }
    }

    if (productData.sku !== existing.sku) {
      const skuCollision = await prisma.product.findUnique({ where: { sku: productData.sku } });
      if (skuCollision) {
        return res.status(400).json({ success: false, message: "SKU is already in use" });
      }
    }

    // Update fields and replace image sub-table in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Clear old images
      await tx.productImage.deleteMany({ where: { productId: id } });

      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          images: {
            create: images
          }
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' } }
        }
      });
    });

    res.status(200).json({ success: true, message: "Product updated successfully", product });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Archive a product (Soft Delete)
 */
export async function archiveProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED }
    });

    res.status(200).json({ success: true, message: "Product archived successfully", product });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Upload a single product/editor image
 */
export async function handleImageUpload(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    let fileUrl = `/uploads/${req.file.filename}`;

    if (isCloudinaryConfigured()) {
      const cloudinaryResult = await uploadToCloudinary(req.file.path);
      fileUrl = cloudinaryResult.url;
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: fileUrl
    });
  } catch (err) {
    next(err);
  }
}
