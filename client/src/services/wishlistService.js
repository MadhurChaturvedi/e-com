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
