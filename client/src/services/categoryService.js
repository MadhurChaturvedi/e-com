import api from './api';

export const categoryService = {
  async getCategories() {
    return api.get('/categories');
  },

  async getCategoryByIdOrSlug(idOrSlug) {
    return api.get(`/categories/${idOrSlug}`);
  },

  async createCategory(data) {
    return api.post('/categories', data);
  },

  async updateCategory(id, data) {
    return api.put(`/categories/${id}`, data);
  },

  async deleteCategory(id) {
    return api.delete(`/categories/${id}`);
  },
};

export const brandService = {
  async getBrands() {
    return api.get('/brands');
  },

  async getBrandByIdOrSlug(idOrSlug) {
    return api.get(`/brands/${idOrSlug}`);
  },

  async createBrand(data) {
    return api.post('/brands', data);
  },

  async updateBrand(id, data) {
    return api.put(`/brands/${id}`, data);
  },

  async deleteBrand(id) {
    return api.delete(`/brands/${id}`);
  },
};
