import { Banner } from '../models/Banner.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getActiveBanners = async (req, res, next) => {
  try {
    const now = new Date();
    const query = {
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 }).lean();
    return successResponse(res, banners, 'Active banners retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
    return successResponse(res, banners, 'All banners retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image, mobileImage, ctaLabel, destinationUrl, displayOrder, startDate, endDate, isActive } = req.body;

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

    return successResponse(res, banner, 'Banner created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return errorResponse(res, 'Banner not found.', 404);
    }

    Object.assign(banner, req.body);
    await banner.save();

    return successResponse(res, banner, 'Banner updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return errorResponse(res, 'Banner not found.', 404);
    }

    return successResponse(res, null, 'Banner deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export const reorderBanners = async (req, res, next) => {
  try {
    const { orderings } = req.body; // array of { id, displayOrder }
    if (!Array.isArray(orderings)) {
      return errorResponse(res, 'Invalid ordering format.', 400);
    }

    const bulkOps = orderings.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { displayOrder: item.displayOrder },
      },
    }));

    await Banner.bulkWrite(bulkOps);
    return successResponse(res, null, 'Banners reordered successfully.');
  } catch (error) {
    next(error);
  }
};
