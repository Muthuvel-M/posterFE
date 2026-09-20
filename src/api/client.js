const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Eagerly pre-warm the backend server on startup to eliminate cold starts
try {
  fetch(`${BASE_URL}/health`, { method: 'GET', keepalive: true }).catch(() => {});
} catch (e) {
  // Silent catch
}

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auraframe_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 35000);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        localStorage.removeItem('auraframe_token');
        localStorage.removeItem('auraframe_user');
        window.dispatchEvent(new Event('auth_logout'));
      }
      const errorMsg =
        data.message ||
        (data.errors && data.errors[0]?.message) ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Server took too long to respond. Waking up server, please retry.');
    }
    throw err;
  }
};

export const api = {
  // Auth
  login: (credentials) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  googleLogin: (tokenData) =>
    request('/auth/google', { method: 'POST', body: JSON.stringify(tokenData) }),
  getMe: () => request('/auth/me'),
  updatePassword: (data) =>
    request('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (productData) =>
    request('/products', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id, productData) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) }),
  updateStock: (id, adjustment) =>
    request(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ adjustment }),
    }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },
  getCustomerById: (id) => request(`/customers/${id}`),
  createCustomer: (customerData) =>
    request('/customers', { method: 'POST', body: JSON.stringify(customerData) }),
  updateCustomer: (id, customerData) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customerData) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Sales
  createSale: (saleData) =>
    request('/sales', { method: 'POST', body: JSON.stringify(saleData) }),
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? `?${query}` : ''}`);
  },
  getSaleById: (id) => request(`/sales/${id}`),
  markSalePaid: (id, paymentMethod = 'upi') =>
    request(`/sales/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentMethod }),
    }),
  voidSale: (id) => request(`/sales/${id}/void`, { method: 'PATCH' }),
  deleteSale: (id) => request(`/sales/${id}`, { method: 'DELETE' }),

  // Payments (Razorpay Gateway)
  getRazorpayKey: () => request('/payments/key'),
  createRazorpayOrder: (data) =>
    request('/payments/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyRazorpayPayment: (data) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
  createPaymentQR: (data) =>
    request('/payments/qr', { method: 'POST', body: JSON.stringify(data) }),


  // Analytics
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics/dashboard${query ? `?${query}` : ''}`);
  },

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settingsData) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(settingsData) }),

  // Custom Orders / Customization
  getCustomOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/custom-orders${query ? `?${query}` : ''}`);
  },
  getCustomOrderById: (id) => request(`/custom-orders/${id}`),
  getCustomOrderStats: () => request('/custom-orders/stats'),
  createCustomOrder: (orderData) =>
    request('/custom-orders', { method: 'POST', body: JSON.stringify(orderData) }),
  updateCustomOrder: (id, orderData) =>
    request(`/custom-orders/${id}`, { method: 'PUT', body: JSON.stringify(orderData) }),
  updateCustomOrderStatus: (id, statusData) =>
    request(`/custom-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    }),
  deleteCustomOrder: (id) => request(`/custom-orders/${id}`, { method: 'DELETE' }),
};
