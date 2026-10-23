import { Router } from 'express';
import {
  getBrands,
  getBrandByIdOrSlug,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { cacheRoute } from '../middlewares/cache.middleware.js';
import { brandValidator } from '../validators/categoryValidators.js';

const router = Router();

router.get(
  '/',
  optionalAuth,
  cacheRoute(300, {
    skip: (req) => req.user?.role === 'admin',
  }),
  getBrands
);
router.get('/:idOrSlug', cacheRoute(300), getBrandByIdOrSlug);
router.post('/', requireAuth, requireAdmin, brandValidator, validate, createBrand);
router.put('/:id', requireAuth, requireAdmin, brandValidator, validate, updateBrand);
router.delete('/:id', requireAuth, requireAdmin, deleteBrand);

export default router;
