import api from './api';

export const wishlistService = {
  async getWishlist() {
    return api.get('/wishlist');
  },

  async addToWishlist(productId) {
    return api.post('/wishlist/items', { productId });
  },

  async removeFromWishlist(productId) {
    return api.delete(`/wishlist/items/${productId}`);
  },

  async moveToCart(productId) {
    return api.post(`/wishlist/items/${productId}/move-to-cart`);
  },
};

export const orderService = {
  async createOrder(data) {
    return api.post('/orders', data);
  },

  async getMyOrders(params = {}) {
    return api.get('/orders/my-orders', { params });
  },

  async getOrderById(id) {
    return api.get(`/orders/${id}`);
  },

  async cancelOrder(id, reason) {
    return api.post(`/orders/${id}/cancel`, { reason });
  },

  // Admin order services
  async getAllOrders(params = {}) {
    return api.get('/orders/admin/all', { params });
  },

  async updateOrderStatus(id, data) {
    return api.patch(`/orders/admin/${id}/status`, data);
  },
};
