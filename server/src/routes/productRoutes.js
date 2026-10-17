import { Router } from 'express';
import {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getRelatedProducts,
} from '../controllers/productController.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { productValidator, updateProductValidator } from '../validators/productValidators.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/:idOrSlug', getProductByIdOrSlug);
router.get('/:id/related', getRelatedProducts);

// Admin-protected routes
router.post('/', requireAuth, requireAdmin, productValidator, validate, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProductValidator, validate, updateProduct);
router.patch('/:id/status', requireAuth, requireAdmin, updateProductStatus);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
