import { Coupon } from '../models/Coupon.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const amount = Number(orderAmount) || 0;

    if (!code) {
      return errorResponse(res, 'Coupon code is required.', 400);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!coupon) {
      return errorResponse(res, 'Invalid or expired coupon code.', 404);
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return errorResponse(res, 'Coupon promotion has not started yet.', 400);
    }
    if (coupon.expiryDate && coupon.expiryDate < now) {
      return errorResponse(res, 'This coupon has expired.', 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return errorResponse(res, 'This coupon has reached its maximum usage limit.', 400);
    }

    if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
      return errorResponse(
        res,
        `Minimum order amount of $${coupon.minOrderAmount} required to use this coupon.`,
        400
      );
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(coupon.discountValue, amount);
    }

    return successResponse(
      res,
      {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discount * 100) / 100,
        description: coupon.description,
      },
      'Coupon applied successfully!'
    );
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return successResponse(res, coupons, 'Coupons retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
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
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return errorResponse(res, `Coupon code "${code}" already exists.`, 409);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
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

    return successResponse(res, coupon, 'Coupon created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return errorResponse(res, 'Coupon not found.', 404);
    }

    if (req.body.code && req.body.code.toUpperCase().trim() !== coupon.code) {
      const existing = await Coupon.findOne({
        code: req.body.code.toUpperCase().trim(),
        _id: { $ne: id },
      });
      if (existing) {
        return errorResponse(res, `Coupon code "${req.body.code}" is already in use.`, 409);
      }
      coupon.code = req.body.code.toUpperCase().trim();
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

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        coupon[field] = req.body[field];
      }
    });

    await coupon.save();
    return successResponse(res, coupon, 'Coupon updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return errorResponse(res, 'Coupon not found.', 404);
    }

    return successResponse(res, null, 'Coupon deleted successfully.');
  } catch (error) {
    next(error);
  }
};
