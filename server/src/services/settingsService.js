import { StoreSettings } from '../models/StoreSettings.js';
import { cacheService } from './cacheService.js';

class SettingsService {
  async getPublicSettings() {
    return cacheService.wrap(
      'settings:public',
      async () => {
        let settings = await StoreSettings.findOne().lean();
        if (!settings) {
          settings = await StoreSettings.create({});
        }

        return {
          storeName: settings.storeName,
          tagline: settings.tagline,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          address: settings.address,
          currency: settings.currency,
          shipping: settings.shipping,
          paymentMethods: settings.paymentMethods,
          announcement: settings.announcement,
        };
      },
      600
    );
  }

  async getAdminSettings() {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }
    return settings;
  }

  async updateAdminSettings(data) {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings({});
    }

    Object.assign(settings, data);
    await settings.save();

    await cacheService.invalidateSettings();
    return settings;
  }
}

export const settingsService = new SettingsService();
