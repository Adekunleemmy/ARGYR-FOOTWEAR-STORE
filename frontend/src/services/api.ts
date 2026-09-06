const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Authorization wrapper around fetch.
 * Sets credentials to 'include' so that HTTP-only secure session cookies are transmitted.
 * Selects the appropriate Authorization token (admin vs customer).
 */
async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;

  options.credentials = 'include';

  // Determine token: customer vs admin
  const isAdminPath = path.startsWith('/admin');
  const token = isAdminPath
    ? localStorage.getItem('admin_token')
    : localStorage.getItem('customer_token') || localStorage.getItem('admin_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  options.headers = headers;

  const response = await fetch(url, options);

  // Catch 401 Session expirations
  if (response.status === 401) {
    if (isAdminPath && path !== '/admin/auth/login' && path !== '/admin/auth/me') {
      localStorage.removeItem('admin_token');
      window.dispatchEvent(new Event('argyr_unauthorized'));
    } else if (!isAdminPath && path !== '/auth/login' && path !== '/auth/register' && path !== '/auth/me') {
      localStorage.removeItem('customer_token');
      window.dispatchEvent(new Event('argyr_customer_unauthorized'));
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

export const api = {
  // ==========================================
  // 1. PUBLIC STOREFRONT API
  // ==========================================
  getProducts: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/products${query}`);
  },

  getProductBySlug: (slug: string) => request(`/products/${slug}`),

  getCategories: () => request('/categories'),

  getShippingMethods: () => request('/shipping/methods'),

  getPublicSettings: () => request('/settings/public'),

  // Legacy Order enquiry
  createOrder: (orderData: any) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),

  // Custom Studio
  createCustomRequest: (formData: FormData) => request('/custom-requests', {
    method: 'POST',
    body: formData
  }),

  // ==========================================
  // 2. CUSTOMER AUTHENTICATION API
  // ==========================================
  customerRegister: (data: any) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  customerVerifyOtp: async (data: any) => {
    const res = await request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      localStorage.setItem('customer_token', res.token);
    }
    return res;
  },

  customerResendOtp: (data: any) => request('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  customerLogin: async (data: any) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      localStorage.setItem('customer_token', res.token);
    }
    return res;
  },

  customerLogout: async () => {
    try {
      return await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('customer_token');
    }
  },

  customerMe: () => request('/auth/me'),

  customerForgotPassword: (data: any) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  customerResetPassword: (data: any) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // ==========================================
  // 3. AUTHENTICATED CUSTOMER PROFILE & ORDERS
  // ==========================================
  getCustomerProfile: () => request('/customer/profile'),

  updateCustomerProfile: (data: any) => request('/customer/profile', {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  addCustomerAddress: (data: any) => request('/customer/addresses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  deleteCustomerAddress: (id: string) => request(`/customer/addresses/${id}`, {
    method: 'DELETE'
  }),

  getCustomerOrders: () => request('/customer/orders'),

  getCustomerOrderDetail: (id: string) => request(`/customer/orders/${id}`),

  // ==========================================
  // 4. CHECKOUT & FLUTTERWAVE PAYMENTS
  // ==========================================
  initializeCheckout: (checkoutData: any) => request('/checkout/initialize', {
    method: 'POST',
    body: JSON.stringify(checkoutData)
  }),

  verifyFlutterwavePayment: (reference: string, transactionId?: string) => {
    const query = transactionId ? `?transaction_id=${transactionId}` : '';
    return request(`/payments/flutterwave/verify/${reference}${query}`);
  },

  // ==========================================
  // 5. ADMIN AUTHENTICATION API
  // ==========================================
  adminLogin: async (credentials: any) => {
    const data = await request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    return data;
  },

  adminLogout: async () => {
    try {
      return await request('/admin/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('admin_token');
    }
  },

  adminMe: () => request('/admin/auth/me'),

  // ==========================================
  // 6. ADMIN DASHBOARD & CRUD API
  // ==========================================
  adminGetDashboardStats: () => request('/admin/dashboard/stats'),

  // Admin Products
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

  // Admin Categories
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
  adminGetOrders: (params?: { status?: string; search?: string; startDate?: string; endDate?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/admin/orders${query}`);
  },
  adminGetOrderDetail: (id: string) => request(`/admin/orders/${id}`),
  adminUpdateOrderStatus: (id: string, statusPayload: { status: string; internalNote?: string; customerNote?: string }) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusPayload)
    }),
  adminTrackWhatsapp: (id: string) => request(`/admin/orders/${id}/track-whatsapp`, {
    method: 'PATCH'
  }),

  // Admin Customer Management
  adminGetCustomers: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/admin/customers${query}`);
  },

  // Admin Shipping Configuration
  adminGetShippingMethods: () => request('/admin/shipping'),
  adminUpdateShippingMethod: (id: string, data: any) => request(`/admin/shipping/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  // Admin Custom Shoe Requests Management
  adminGetCustomRequests: () => request('/admin/custom-requests'),
  adminGetCustomRequestDetail: (id: string) => request(`/admin/custom-requests/${id}`),
  adminUpdateCustomRequestStatus: (id: string, status: string) => request(`/admin/custom-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Admin Settings Management & Notifications
  adminGetSettings: () => request('/admin/settings'),
  adminUpdateSettings: (settings: Record<string, string>) => request('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),
  adminAddNotificationEmail: (email: string) => request('/admin/notification-emails', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  adminDeleteNotificationEmail: (id: string) => request(`/admin/notification-emails/${id}`, {
    method: 'DELETE'
  })
};

export { BASE_URL };
