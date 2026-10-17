import { Router } from 'express';
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from '../controllers/bannerController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { bannerValidator } from '../validators/orderValidators.js';

const router = Router();

// Public route
router.get('/active', getActiveBanners);

// Admin routes
router.get('/', requireAuth, requireAdmin, getAllBanners);
router.post('/', requireAuth, requireAdmin, bannerValidator, validate, createBanner);
router.patch('/reorder', requireAuth, requireAdmin, reorderBanners);
router.put('/:id', requireAuth, requireAdmin, updateBanner);
router.delete('/:id', requireAuth, requireAdmin, deleteBanner);

export default router;
