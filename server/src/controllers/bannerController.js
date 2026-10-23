import { bannerService } from '../services/bannerService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await bannerService.getActiveBanners();
    return successResponse(res, banners, 'Active banners retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await bannerService.getAllBanners();
    return successResponse(res, banners, 'All banners retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.createBanner(req.body);
    return successResponse(res, banner, 'Banner created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.updateBanner(req.params.id, req.body);
    return successResponse(res, banner, 'Banner updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    await bannerService.deleteBanner(req.params.id);
    return successResponse(res, null, 'Banner deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export const reorderBanners = async (req, res, next) => {
  try {
    await bannerService.reorderBanners(req.body.orderings);
    return successResponse(res, null, 'Banners reordered successfully.');
  } catch (error) {
    next(error);
  }
};
