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
import { brandValidator } from '../validators/categoryValidators.js';

const router = Router();

router.get('/', optionalAuth, getBrands);
router.get('/:idOrSlug', getBrandByIdOrSlug);
router.post('/', requireAuth, requireAdmin, brandValidator, validate, createBrand);
router.put('/:id', requireAuth, requireAdmin, brandValidator, validate, updateBrand);
router.delete('/:id', requireAuth, requireAdmin, deleteBrand);

export default router;
