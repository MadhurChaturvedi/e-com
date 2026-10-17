import { Router } from 'express';
import {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { categoryValidator } from '../validators/categoryValidators.js';

const router = Router();

router.get('/', optionalAuth, getCategories);
router.get('/:idOrSlug', getCategoryByIdOrSlug);
router.post('/', requireAuth, requireAdmin, categoryValidator, validate, createCategory);
router.put('/:id', requireAuth, requireAdmin, categoryValidator, validate, updateCategory);
router.delete('/:id', requireAuth, requireAdmin, deleteCategory);

export default router;
