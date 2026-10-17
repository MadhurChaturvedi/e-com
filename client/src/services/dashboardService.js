import api from './api';

export const couponService = {
  async validateCoupon(code, orderAmount) {
    return api.post('/coupons/validate', { code, orderAmount });
  },

  async getAllCoupons() {
    return api.get('/coupons');
  },

  async createCoupon(data) {
    return api.post('/coupons', data);
  },

  async updateCoupon(id, data) {
    return api.put(`/coupons/${id}`, data);
  },

  async deleteCoupon(id) {
    return api.delete(`/coupons/${id}`);
  },
};

export const dashboardService = {
  async getStats() {
    return api.get('/admin/dashboard/stats');
  },

  async getSales(days = 7) {
    return api.get(`/admin/dashboard/sales?days=${days}`);
  },

  async getTopProducts() {
    return api.get('/admin/dashboard/top-products');
  },

  async getRecentOrders() {
    return api.get('/admin/dashboard/recent-orders');
  },

  async getLowStock() {
    return api.get('/admin/dashboard/low-stock');
  },

  async getInventoryHistory() {
    return api.get('/admin/dashboard/inventory-history');
  },

  async getCustomers(params = {}) {
    return api.get('/admin/dashboard/customers', { params });
  },

  async toggleCustomerStatus(id) {
    return api.patch(`/admin/dashboard/customers/${id}/status`);
  },
};

export const settingsService = {
  async getPublicSettings() {
    return api.get('/settings/public');
  },

  async getAdminSettings() {
    return api.get('/settings/admin');
  },

  async updateAdminSettings(data) {
    return api.put('/settings/admin', data);
  },
};

export const uploadService = {
  async uploadSingle(file) {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async uploadMultiple(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const reviewService = {
  async getProductReviews(productId) {
    return api.get(`/reviews/products/${productId}`);
  },

  async createReview(productId, data) {
    return api.post(`/reviews/products/${productId}`, data);
  },

  async deleteReview(id) {
    return api.delete(`/reviews/${id}`);
  },
};
