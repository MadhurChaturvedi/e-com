import api from './api';

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
