import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { requireCustomer } from '../middleware/customerAuth';
import { upload } from '../middleware/upload';

// Import Controllers
import * as authController from '../controllers/authController';
import * as customerAuthController from '../controllers/customerAuthController';
import * as customerProfileController from '../controllers/customerProfileController';
import * as paymentController from '../controllers/paymentController';
import * as shippingController from '../controllers/shippingController';
import * as categoryController from '../controllers/categoryController';
import * as productController from '../controllers/productController';
import * as orderController from '../controllers/orderController';
import * as customController from '../controllers/customController';
import * as settingController from '../controllers/settingController';
import * as dashboardController from '../controllers/dashboardController';
import * as adminCustomerController from '../controllers/adminCustomerController';

const router = Router();

// ==========================================
// 1. PUBLIC STOREFRONT ROUTES
// ==========================================

// Catalog Products & Categories
router.get('/products', productController.getCatalogProducts);
router.get('/products/:slug', productController.getProductDetails);
router.get('/categories', categoryController.getActiveCategories);

// Public Shipping & Settings
router.get('/shipping/methods', shippingController.getShippingMethods);
router.get('/settings/public', settingController.getPublicSettings);

// Legacy WhatsApp Order Enquiries (preserved)
router.post('/orders', orderController.createOrderEnquiry);

// Custom Shoe Request Studio (uploads up to 5 reference images)
router.post('/custom-requests', upload.array('images', 5), customController.createCustomRequest);

// Flutterwave Webhook (Idempotent callback from Flutterwave)
router.post('/payments/flutterwave/webhook', paymentController.handleWebhook);

// Flutterwave Verification (Called upon redirect from payment gateway)
router.get('/payments/flutterwave/verify/:reference', paymentController.verifyPayment);


// ==========================================
// 2. CUSTOMER AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/register', customerAuthController.register);
router.post('/auth/verify-otp', customerAuthController.verifyOtp);
router.post('/auth/resend-otp', customerAuthController.resendOtp);
router.post('/auth/login', customerAuthController.login);
router.post('/auth/logout', customerAuthController.logout);
router.post('/auth/forgot-password', customerAuthController.forgotPassword);
router.post('/auth/reset-password', customerAuthController.resetPassword);

// Customer session check
router.get('/auth/me', requireCustomer, customerAuthController.getMe);


// ==========================================
// 3. AUTHENTICATED CUSTOMER ROUTES
// ==========================================

// Profile & Saved Addresses
router.get('/customer/profile', requireCustomer, customerProfileController.getProfile);
router.patch('/customer/profile', requireCustomer, customerProfileController.updateProfile);
router.post('/customer/addresses', requireCustomer, customerProfileController.addAddress);
router.delete('/customer/addresses/:id', requireCustomer, customerProfileController.deleteAddress);

// Order History & Individual Order Detail
router.get('/customer/orders', requireCustomer, customerProfileController.getCustomerOrders);
router.get('/customer/orders/:id', requireCustomer, customerProfileController.getCustomerOrderDetail);

// Authenticated Checkout & Flutterwave Payment Initialization
router.post('/checkout/initialize', requireCustomer, paymentController.initializeCheckout);
router.post('/payments/flutterwave/initialize', requireCustomer, paymentController.initializeCheckout);


// ==========================================
// 4. ADMIN AUTHENTICATION
// ==========================================
router.post('/admin/auth/login', authController.login);
router.get('/admin/auth/me', requireAdmin, authController.getMe);
router.post('/admin/auth/logout', requireAdmin, authController.logout);


// ==========================================
// 5. ADMIN PROTECTED CONSOLE API ROUTES
// ==========================================

// Dashboard KPI metrics & recent activity
router.get('/admin/dashboard/stats', requireAdmin, dashboardController.getDashboardStats);

// Product Management CRUD
router.get('/admin/products', requireAdmin, productController.adminGetProducts);
router.post('/admin/products', requireAdmin, productController.createProduct);
router.put('/admin/products/:id', requireAdmin, productController.updateProduct);
router.delete('/admin/products/:id', requireAdmin, productController.archiveProduct);
router.post('/admin/uploads', requireAdmin, upload.single('image'), productController.handleImageUpload);

// Category Management CRUD
router.get('/admin/categories', requireAdmin, categoryController.getAllCategories);
router.post('/admin/categories', requireAdmin, categoryController.createCategory);
router.put('/admin/categories/:id', requireAdmin, categoryController.updateCategory);
router.delete('/admin/categories/:id', requireAdmin, categoryController.deleteCategory);

// Order Management
router.get('/admin/orders', requireAdmin, orderController.adminGetOrders);
router.get('/admin/orders/:id', requireAdmin, orderController.adminGetOrderDetail);
router.patch('/admin/orders/:id/status', requireAdmin, orderController.adminUpdateOrderStatus);
router.patch('/admin/orders/:id/track-whatsapp', requireAdmin, orderController.trackWhatsappClick);

// Customer Management
router.get('/admin/customers', requireAdmin, adminCustomerController.adminGetCustomers);

// Shipping Methods Configuration
router.get('/admin/shipping', requireAdmin, shippingController.adminGetShippingMethods);
router.patch('/admin/shipping/:id', requireAdmin, shippingController.adminUpdateShippingMethod);

// Custom Shoe Request Management
router.get('/admin/custom-requests', requireAdmin, customController.adminGetCustomRequests);
router.get('/admin/custom-requests/:id', requireAdmin, customController.adminGetCustomRequestDetail);
router.patch('/admin/custom-requests/:id/status', requireAdmin, customController.adminUpdateCustomRequestStatus);

// Settings Management & Notification Email Recipients
router.get('/admin/settings', requireAdmin, settingController.adminGetSettings);
router.put('/admin/settings', requireAdmin, settingController.adminUpdateSettings);
router.post('/admin/notification-emails', requireAdmin, settingController.adminAddNotificationEmail);
router.delete('/admin/notification-emails/:id', requireAdmin, settingController.adminDeleteNotificationEmail);

export default router;
