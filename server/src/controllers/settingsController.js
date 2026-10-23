import { settingsService } from '../services/settingsService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getPublicSettings();
    return successResponse(res, settings, 'Store settings retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getAdminSettings();
    return successResponse(res, settings, 'Admin store settings retrieved.');
  } catch (error) {
    next(error);
  }
};

export const updateAdminSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updateAdminSettings(req.body);
    return successResponse(res, settings, 'Store settings updated successfully.');
  } catch (error) {
    next(error);
  }
};
