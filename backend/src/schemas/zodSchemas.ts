import { z } from 'zod';
import { Gender, ProductStatus, OrderStatus, CustomRequestStatus } from '@prisma/client';

// ==========================================
// ADMIN AUTH SCHEMAS
// ==========================================
export const AdminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// ==========================================
// CUSTOMER AUTH SCHEMAS
// ==========================================
export const CustomerRegisterSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional().nullable(),
  marketingOptIn: z.boolean().default(false)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const CustomerLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const CustomerVerifyOtpSchema = z.object({
  email: z.string().email('Valid email is required').optional(),
  customerId: z.string().optional(),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits')
}).refine(data => data.email || data.customerId, {
  message: "Email or Customer ID is required to verify code",
  path: ["email"]
});

export const CustomerResendOtpSchema = z.object({
  email: z.string().email('Valid email is required').optional(),
  customerId: z.string().optional()
}).refine(data => data.email || data.customerId, {
  message: "Email or Customer ID is required to resend code",
  path: ["email"]
});

export const CustomerForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

export const CustomerResetPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
  token: z.string().min(10, 'Invalid reset token'),
  password: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const CustomerProfileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().min(6, 'Valid phone number required').optional().nullable(),
  marketingOptIn: z.boolean().optional()
});

export const CustomerAddressSchema = z.object({
  label: z.string().optional().nullable(),
  recipientName: z.string().min(2, 'Recipient name is required'),
  phone: z.string().min(6, 'Contact phone is required'),
  country: z.string().min(2, 'Country is required'),
  stateRegion: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  addressLine: z.string().min(5, 'Delivery address is required'),
  postalCode: z.string().optional().nullable(),
  isDefault: z.boolean().default(false)
});

// ==========================================
// CATALOG & STORE SCHEMAS
// ==========================================
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

// ==========================================
// CHECKOUT & ORDERS SCHEMAS
// ==========================================
export const OrderItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  selectedSize: z.string().min(1, 'Size is required'),
  selectedColour: z.string().optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
});

// Legacy order enquiry schema (preserved for compatibility)
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

// New Authenticated Checkout initialization schema
export const CheckoutInitializeSchema = z.object({
  shippingAddress: z.object({
    recipientName: z.string().min(2, 'Full recipient name is required'),
    phone: z.string().min(6, 'Valid phone number is required'),
    country: z.string().min(2, 'Country is required'),
    stateRegion: z.string().optional().nullable(),
    city: z.string().min(2, 'City is required'),
    addressLine: z.string().min(5, 'Full delivery address is required'),
    postalCode: z.string().optional().nullable(),
    deliveryInstructions: z.string().optional().nullable(),
  }),
  shippingMethodId: z.string().uuid('Please select a valid shipping method'),
  notes: z.string().optional().nullable(),
  items: z.array(OrderItemInputSchema).min(1, 'Cart must contain at least one item'),
  saveAddress: z.boolean().default(false)
});

// Shipping Method Admin Update Schema
export const ShippingMethodUpdateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Shipping fee must be 0 or positive'),
  currency: z.string().default('NGN'),
  active: z.boolean().default(true),
  sortOrder: z.number().int().optional()
});

// Admin Notification Email Schema
export const AdminNotificationEmailSchema = z.object({
  email: z.string().email('Invalid email address')
});

// Custom Shoe Request Schemas
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
  status: z.nativeEnum(OrderStatus),
  internalNote: z.string().optional().nullable(),
  customerNote: z.string().optional().nullable()
});

export const CustomRequestStatusUpdateSchema = z.object({
  status: z.nativeEnum(CustomRequestStatus)
});
