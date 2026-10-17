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
