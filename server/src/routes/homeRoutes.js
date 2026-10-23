import { Router } from 'express';
import { getHomeData } from '../controllers/homeController.js';
import {
  getTrendingProducts,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
} from '../controllers/productController.js';
import { cacheRoute } from '../middlewares/cache.middleware.js';
import { cacheService } from '../services/cacheService.js';

const router = Router();

// Backward-compatible cache invalidation hook
export const invalidateHomeCache = () => {
  cacheService.invalidateHome().catch((err) => {
    console.warn('[HomeRoutes] Cache invalidation warning:', err.message);
  });
};

// Full homepage payload with 60s Redis/memory caching
router.get('/', cacheRoute(60), getHomeData);

router.get('/trending', cacheRoute(120), getTrendingProducts);
router.get('/featured', cacheRoute(120), getFeaturedProducts);
router.get('/best-sellers', cacheRoute(120), getBestSellers);
router.get('/new-arrivals', cacheRoute(120), getNewArrivals);

export default router;
