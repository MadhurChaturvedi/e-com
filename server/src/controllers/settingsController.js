import { StoreSettings } from '../models/StoreSettings.js';
import { successResponse } from '../utils/apiResponse.js';

export const getPublicSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne().lean();
    if (!settings) {
      settings = await StoreSettings.create({});
    }

    return successResponse(res, {
      storeName: settings.storeName,
      tagline: settings.tagline,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      address: settings.address,
      currency: settings.currency,
      shipping: settings.shipping,
      paymentMethods: settings.paymentMethods,
      announcement: settings.announcement,
    }, 'Store settings retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getAdminSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }

    return successResponse(res, settings, 'Admin store settings retrieved.');
  } catch (error) {
    next(error);
  }
};

export const updateAdminSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings({});
    }

    Object.assign(settings, req.body);
    await settings.save();

    return successResponse(res, settings, 'Store settings updated successfully.');
  } catch (error) {
    next(error);
  }
};
