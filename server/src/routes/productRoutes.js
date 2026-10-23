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
import { cacheRoute } from '../middlewares/cache.middleware.js';
import { productValidator, updateProductValidator } from '../validators/productValidators.js';

const router = Router();

// Public routes with high-speed Redis caching
router.get(
  '/',
  optionalAuth,
  cacheRoute(60, {
    skip: (req) => req.user?.role === 'admin' || req.query.includeInactive === 'true',
  }),
  getProducts
);
router.get('/:idOrSlug', cacheRoute(120), getProductByIdOrSlug);
router.get('/:id/related', cacheRoute(180), getRelatedProducts);

// Admin-protected routes (auto-invalidates product & home caches upon mutations)
router.post('/', requireAuth, requireAdmin, productValidator, validate, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProductValidator, validate, updateProduct);
router.patch('/:id/status', requireAuth, requireAdmin, updateProductStatus);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
