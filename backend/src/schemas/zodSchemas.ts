import { z } from 'zod';
import { Gender, ProductStatus, OrderStatus, CustomRequestStatus } from '@prisma/client';

export const AdminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const CategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric with hyphens'),
  description: z.string().optional().nullable(),
  image: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export const ProductImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  altText: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  publicId: z.string().optional().nullable()
});

export const ProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric with hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().min(5, 'Short description must be at least 5 characters'),
  price: z.number().positive('Price must be greater than zero'),
  bulkPrice: z.number().positive('Bulk price must be greater than zero').optional().nullable(),
  bulkMinimumQuantity: z.number().int().min(1, 'Minimum bulk quantity must be at least 1').default(10),
  stockQuantity: z.number().int().nonnegative('Stock cannot be negative').default(0),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  categoryId: z.string().uuid('Invalid category ID'),
  gender: z.nativeEnum(Gender),
  material: z.string().min(2, 'Material must be at least 2 characters'),
  collection: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  sizes: z.array(z.string()).min(1, 'Product must have at least one size option'),
  images: z.array(ProductImageSchema).default([])
});

export const OrderItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  selectedSize: z.string().min(1, 'Size is required'),
  selectedColour: z.string().optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
});

export const OrderCreateSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(5, 'Phone number must be at least 5 characters'),
  customerEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  deliveryCountry: z.string().min(2, 'Country must be specified'),
  deliveryCity: z.string().min(2, 'City must be specified'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  notes: z.string().optional().nullable(),
  items: z.array(OrderItemInputSchema).min(1, 'Order must contain at least one item')
});

export const CustomRequestCreateSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(5, 'Phone number must be at least 5 characters'),
  customerEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  productId: z.string().uuid('Invalid product ID').optional().nullable(),
  categoryName: z.string().min(2, 'Shoe category is required (e.g., Sneakers, Oxford)'),
  gender: z.nativeEnum(Gender),
  shoeSize: z.string().min(1, 'Size is required'),
  preferredColour: z.string().min(2, 'Color is required'),
  preferredMaterial: z.string().min(2, 'Material is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  description: z.string().min(10, 'Please describe your custom request in detail (min 10 characters)'),
  additionalNotes: z.string().optional().nullable(),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(2, 'City is required'),
  deliveryAddress: z.string().optional().nullable()
});

export const OrderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});

export const CustomRequestStatusUpdateSchema = z.object({
  status: z.nativeEnum(CustomRequestStatus)
});
