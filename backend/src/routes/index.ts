import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

// Import Controllers
import * as authController from '../controllers/authController';
import * as categoryController from '../controllers/categoryController';
import * as productController from '../controllers/productController';
import * as orderController from '../controllers/orderController';
import * as customController from '../controllers/customController';
import * as settingController from '../controllers/settingController';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Catalog Products
router.get('/products', productController.getCatalogProducts);
router.get('/products/:slug', productController.getProductDetails);

// Categories
router.get('/categories', categoryController.getActiveCategories);

// Cart Order Enquiries
router.post('/orders', orderController.createOrderEnquiry);

// Custom Shoe Request (allows up to 5 reference images)
router.post('/custom-requests', upload.array('images', 5), customController.createCustomRequest);

// Store Settings
router.get('/settings/public', settingController.getPublicSettings);

// Public Admin Login (Entrypoint)
router.post('/admin/auth/login', authController.login);


// ==========================================
// ADMIN PROTECTED API ROUTES
// ==========================================

// Auth checks
router.get('/admin/auth/me', requireAdmin, authController.getMe);
router.post('/admin/auth/logout', requireAdmin, authController.logout);

// Dashboard stats
router.get('/admin/dashboard/stats', requireAdmin, dashboardController.getDashboardStats);

// Product Management
router.get('/admin/products', requireAdmin, productController.adminGetProducts);
router.post('/admin/products', requireAdmin, productController.createProduct);
router.put('/admin/products/:id', requireAdmin, productController.updateProduct);
router.delete('/admin/products/:id', requireAdmin, productController.archiveProduct);

// Category Management
router.get('/admin/categories', requireAdmin, categoryController.getAllCategories);
router.post('/admin/categories', requireAdmin, categoryController.createCategory);
router.put('/admin/categories/:id', requireAdmin, categoryController.updateCategory);
router.delete('/admin/categories/:id', requireAdmin, categoryController.deleteCategory);

// Image Upload Endpoint (e.g. for rich descriptions or adding product image urls)
router.post('/admin/uploads', requireAdmin, upload.single('image'), productController.handleImageUpload);

// Order Enquiry Management
router.get('/admin/orders', requireAdmin, orderController.adminGetOrders);
router.get('/admin/orders/:id', requireAdmin, orderController.adminGetOrderDetail);
router.patch('/admin/orders/:id/status', requireAdmin, orderController.adminUpdateOrderStatus);
router.patch('/admin/orders/:id/track-whatsapp', requireAdmin, orderController.trackWhatsappClick);

// Custom Request Management
router.get('/admin/custom-requests', requireAdmin, customController.adminGetCustomRequests);
router.get('/admin/custom-requests/:id', requireAdmin, customController.adminGetCustomRequestDetail);
router.patch('/admin/custom-requests/:id/status', requireAdmin, customController.adminUpdateCustomRequestStatus);

// Settings Management
router.get('/admin/settings', requireAdmin, settingController.adminGetSettings);
router.put('/admin/settings', requireAdmin, settingController.adminUpdateSettings);

export default router;
