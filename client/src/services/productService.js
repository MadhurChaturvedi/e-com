import api from './api';

export const productService = {
  async getProducts(params = {}, config = {}) {
    return api.get('/products', { params, ...config });
  },

  async getProductByIdOrSlug(idOrSlug) {
    return api.get(`/products/${idOrSlug}`);
  },

  async getRelatedProducts(id) {
    return api.get(`/products/${id}/related`);
  },

  async createProduct(data) {
    return api.post('/products', data);
  },

  async updateProduct(id, data) {
    return api.put(`/products/${id}`, data);
  },

  async updateProductStatus(id, data) {
    return api.patch(`/products/${id}/status`, data);
  },

  async deleteProduct(id) {
    return api.delete(`/products/${id}`);
  },

  // Homepage sections
  async getTrending() {
    return api.get('/home/trending');
  },

  async getFeatured() {
    return api.get('/home/featured');
  },

  async getBestSellers() {
    return api.get('/home/best-sellers');
  },

  async getNewArrivals() {
    return api.get('/home/new-arrivals');
  },

  async getHomeData() {
    return api.get('/home');
  },
};
