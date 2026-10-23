import { couponService } from '../services/couponService.js';
import { successResponse } from '../utils/apiResponse.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const result = await couponService.validateCoupon(code, orderAmount);
    return successResponse(res, result, 'Coupon applied successfully!');
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await couponService.getAllCoupons();
    return successResponse(res, coupons, 'Coupons retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    return successResponse(res, coupon, 'Coupon created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    return successResponse(res, coupon, 'Coupon updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    return successResponse(res, null, 'Coupon deleted successfully.');
  } catch (error) {
    next(error);
  }
};
