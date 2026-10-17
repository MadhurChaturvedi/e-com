import api from './api';

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
