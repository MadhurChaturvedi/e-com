import { Router } from 'express';
import {
  getTrendingProducts,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
} from '../controllers/productController.js';
import { Banner } from '../models/Banner.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

// In-memory cache for fast sub-millisecond response
let homeCache = null;
let homeCacheExpiry = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export const invalidateHomeCache = () => {
  homeCache = null;
  homeCacheExpiry = 0;
};

// Full homepage payload for lightning-fast initial page load
router.get('/', async (req, res, next) => {
  try {
    const nowTime = Date.now();
    if (homeCache && nowTime < homeCacheExpiry) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
      return successResponse(res, homeCache, 'Home sections data retrieved from cache.');
    }

    const now = new Date();
    const bannerQuery = {
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const [
      banners,
      categories,
      brands,
      trending,
      featured,
      bestSellers,
      newArrivals,
    ] = await Promise.all([
      Banner.find(bannerQuery).sort({ displayOrder: 1 }).limit(6).lean(),
      Category.find({ isActive: true, parentCategory: null }).sort({ displayOrder: 1 }).limit(8).lean(),
      Brand.find({ isActive: true }).sort({ displayOrder: 1 }).limit(8).lean(),
      Product.find({ isActive: true, isTrending: true })
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name slug logo')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Product.find({ isActive: true, isFeatured: true })
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name slug logo')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Product.find({ isActive: true })
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name slug logo')
        .sort({ salesCount: -1, averageRating: -1 })
        .limit(8)
        .lean(),
      Product.find({ isActive: true })
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name slug logo')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const payload = {
      banners,
      categories,
      brands,
      trending,
      featured,
      bestSellers,
      newArrivals,
    };

    homeCache = payload;
    homeCacheExpiry = nowTime + CACHE_TTL_MS;

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return successResponse(res, payload, 'Home sections data retrieved.');
  } catch (error) {
    next(error);
  }
});

router.get('/trending', getTrendingProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);

export default router;

