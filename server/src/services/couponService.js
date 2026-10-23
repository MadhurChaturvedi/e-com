import { Coupon } from '../models/Coupon.js';
import { notFound, badRequest, conflict } from '../utils/appError.js';

class CouponService {
  async validateCoupon(code, orderAmount) {
    const amount = Number(orderAmount) || 0;

    if (!code) {
      throw badRequest('Coupon code is required.');
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!coupon) {
      throw notFound('Invalid or expired coupon code.');
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      throw badRequest('Coupon promotion has not started yet.');
    }
    if (coupon.expiryDate && coupon.expiryDate < now) {
      throw badRequest('This coupon has expired.');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw badRequest('This coupon has reached its maximum usage limit.');
    }

    if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
      throw badRequest(`Minimum order amount of $${coupon.minOrderAmount} required to use this coupon.`);
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(coupon.discountValue, amount);
    }

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discount * 100) / 100,
      description: coupon.description,
    };
  }

  async getAllCoupons() {
    return Coupon.find().sort({ createdAt: -1 }).lean();
  }

  async createCoupon(data) {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      startDate,
      expiryDate,
      isActive,
    } = data;

    const formattedCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: formattedCode });
    if (existing) {
      throw conflict(`Coupon code "${code}" already exists.`);
    }

    return Coupon.create({
      code: formattedCode,
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      startDate: startDate || null,
      expiryDate: expiryDate || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });
  }

  async updateCoupon(id, data) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw notFound('Coupon not found.');
    }

    if (data.code && data.code.toUpperCase().trim() !== coupon.code) {
      const formattedCode = data.code.toUpperCase().trim();
      const existing = await Coupon.findOne({
        code: formattedCode,
        _id: { $ne: id },
      });
      if (existing) {
        throw conflict(`Coupon code "${data.code}" is already in use.`);
      }
      coupon.code = formattedCode;
    }

    const fields = [
      'description',
      'discountType',
      'discountValue',
      'minOrderAmount',
      'maxDiscountAmount',
      'usageLimit',
      'startDate',
      'expiryDate',
      'isActive',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        coupon[field] = data[field];
      }
    });

    await coupon.save();
    return coupon;
  }

  async deleteCoupon(id) {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw notFound('Coupon not found.');
    }
    return true;
  }
}

export const couponService = new CouponService();
