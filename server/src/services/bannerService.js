import { Banner } from '../models/Banner.js';
import { cacheService } from './cacheService.js';
import { notFound, badRequest } from '../utils/appError.js';

class BannerService {
  async getActiveBanners() {
    const now = new Date();
    const query = {
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    return Banner.find(query).sort({ displayOrder: 1, createdAt: -1 }).lean();
  }

  async getAllBanners() {
    return Banner.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
  }

  async createBanner(data) {
    const {
      title,
      subtitle,
      image,
      mobileImage,
      ctaLabel,
      destinationUrl,
      displayOrder,
      startDate,
      endDate,
      isActive,
    } = data;

    const banner = await Banner.create({
      title,
      subtitle,
      image,
      mobileImage,
      ctaLabel: ctaLabel || 'Shop Now',
      destinationUrl,
      displayOrder: displayOrder || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    await cacheService.invalidateBanners();
    return banner;
  }

  async updateBanner(id, data) {
    const banner = await Banner.findById(id);
    if (!banner) {
      throw notFound('Banner not found.');
    }

    Object.assign(banner, data);
    await banner.save();

    await cacheService.invalidateBanners();
    return banner;
  }

  async deleteBanner(id) {
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      throw notFound('Banner not found.');
    }

    await cacheService.invalidateBanners();
    return true;
  }

  async reorderBanners(orderings) {
    if (!Array.isArray(orderings)) {
      throw badRequest('Invalid ordering format.');
    }

    const bulkOps = orderings.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { displayOrder: item.displayOrder },
      },
    }));

    await Banner.bulkWrite(bulkOps);
    await cacheService.invalidateBanners();
    return true;
  }
}

export const bannerService = new BannerService();
