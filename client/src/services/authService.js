import api from './api';

export const authService = {
  async register(data) {
    return api.post('/auth/register', data);
  },

  async login(data) {
    return api.post('/auth/login', data);
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getMe() {
    return api.get('/auth/me');
  },

  async updateProfile(data) {
    return api.put('/auth/profile', data);
  },

  async changePassword(data) {
    return api.put('/auth/change-password', data);
  },

  async addAddress(data) {
    return api.post('/auth/addresses', data);
  },

  async updateAddress(addressId, data) {
    return api.put(`/auth/addresses/${addressId}`, data);
  },

  async deleteAddress(addressId) {
    return api.delete(`/auth/addresses/${addressId}`);
  },
};
