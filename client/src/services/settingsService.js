import api from './api';

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
