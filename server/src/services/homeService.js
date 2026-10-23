import { Banner } from '../models/Banner.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { cacheService } from './cacheService.js';

class HomeService {
  /**
   * Fetches the comprehensive homepage payload.
   * Utilizes Redis/memory cache with 60-second TTL and instant mutation invalidation.
   */
  async getHomePayload() {
    return cacheService.wrap(
      'home:payload',
      async () => {
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

        return {
          banners,
          categories,
          brands,
          trending,
          featured,
          bestSellers,
          newArrivals,
        };
      },
      60
    );
  }
}

export const homeService = new HomeService();
