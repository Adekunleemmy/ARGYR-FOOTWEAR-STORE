const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Authorization wrapper around fetch.
 * Sets credentials to 'include' so that HTTP-only secure session cookies are transmitted.
 */
async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;

  // Set credentials for cookie tracking
  options.credentials = 'include';

  // Conditionally add Content-Type for JSON objects, but omit for multipart/form-data
  if (options.body && !(options.body instanceof FormData)) {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
  }

  const response = await fetch(url, options);

  // Catch 401 Session expirations globally (except for verification routines)
  if (response.status === 401 && path !== '/admin/auth/login' && path !== '/admin/auth/me') {
    window.dispatchEvent(new Event('argyr_unauthorized'));
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

export const api = {
  // ==========================================
  // PUBLIC CLIENT API
  // ==========================================

  getProducts: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/products${query}`);
  },

  getProductBySlug: (slug: string) => request(`/products/${slug}`),

  getCategories: () => request('/categories'),

  getPublicSettings: () => request('/settings/public'),

  createOrder: (orderData: any) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),

  createCustomRequest: (formData: FormData) => request('/custom-requests', {
    method: 'POST',
    body: formData
  }),

  // ==========================================
  // ADMIN AUTHENTICATION API
  // ==========================================

  adminLogin: (credentials: any) => request('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  adminLogout: () => request('/admin/auth/logout', { method: 'POST' }),

  adminMe: () => request('/admin/auth/me'),

  // ==========================================
  // ADMIN DASHBOARD & CRUD API
  // ==========================================

  adminGetDashboardStats: () => request('/admin/dashboard/stats'),

  // Admin Products CRUD
  adminGetProducts: () => request('/admin/products'),
  adminCreateProduct: (productData: any) => request('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  adminUpdateProduct: (id: string, productData: any) => request(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  adminArchiveProduct: (id: string) => request(`/admin/products/${id}`, {
    method: 'DELETE'
  }),
  adminUploadImage: (formData: FormData) => request('/admin/uploads', {
    method: 'POST',
    body: formData
  }),

  // Admin Categories CRUD
  adminGetCategories: () => request('/admin/categories'),
  adminCreateCategory: (categoryData: any) => request('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData)
  }),
  adminUpdateCategory: (id: string, categoryData: any) => request(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData)
  }),
  adminDeleteCategory: (id: string) => request(`/admin/categories/${id}`, {
    method: 'DELETE'
  }),

  // Admin Orders Management
  adminGetOrders: () => request('/admin/orders'),
  adminGetOrderDetail: (id: string) => request(`/admin/orders/${id}`),
  adminUpdateOrderStatus: (id: string, status: string) => request(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  adminTrackWhatsapp: (id: string) => request(`/admin/orders/${id}/track-whatsapp`, {
    method: 'PATCH'
  }),

  // Admin Custom Shoe Requests Management
  adminGetCustomRequests: () => request('/admin/custom-requests'),
  adminGetCustomRequestDetail: (id: string) => request(`/admin/custom-requests/${id}`),
  adminUpdateCustomRequestStatus: (id: string, status: string) => request(`/admin/custom-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Admin Settings Management
  adminGetSettings: () => request('/admin/settings'),
  adminUpdateSettings: (settings: Record<string, string>) => request('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  })
};
export { BASE_URL };
