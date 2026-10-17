import { Router } from 'express';
import {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { couponValidator } from '../validators/orderValidators.js';

const router = Router();

// Customer can validate coupon
router.post('/validate', validateCoupon);

// Admin routes
router.get('/', requireAuth, requireAdmin, getAllCoupons);
router.post('/', requireAuth, requireAdmin, couponValidator, validate, createCoupon);
router.put('/:id', requireAuth, requireAdmin, updateCoupon);
router.delete('/:id', requireAuth, requireAdmin, deleteCoupon);

export default router;
