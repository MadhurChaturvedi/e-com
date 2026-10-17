import api from './api';

export const bannerService = {
  async getActiveBanners() {
    return api.get('/banners/active');
  },

  async getAllBanners() {
    return api.get('/banners');
  },

  async createBanner(data) {
    return api.post('/banners', data);
  },

  async updateBanner(id, data) {
    return api.put(`/banners/${id}`, data);
  },

  async deleteBanner(id) {
    return api.delete(`/banners/${id}`);
  },

  async reorderBanners(orderings) {
    return api.patch('/banners/reorder', { orderings });
  },
};

export const cartService = {
  async getCart() {
    return api.get('/cart');
  },

  async addToCart(productId, quantity = 1, variantId = null) {
    return api.post('/cart/items', { productId, quantity, variantId });
  },

  async updateCartItem(itemId, quantity) {
    return api.patch(`/cart/items/${itemId}`, { quantity });
  },

  async removeFromCart(itemId) {
    return api.delete(`/cart/items/${itemId}`);
  },

  async clearCart() {
    return api.delete('/cart');
  },

  async mergeCart(guestItems) {
    return api.post('/cart/merge', { guestItems });
  },
};
