import mongoose from 'mongoose';

const storeSettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'NovaStore',
    trim: true,
  },
  tagline: {
    type: String,
    default: 'Premium Electronics, Fashion & Modern Lifestyle Goods',
    trim: true,
  },
  contactEmail: {
    type: String,
    default: 'support@novastore.com',
    trim: true,
  },
  contactPhone: {
    type: String,
    default: '+1 (800) 555-0199',
    trim: true,
  },
  address: {
    type: String,
    default: '742 Evergreen Terrace, Tech Park, Suite 400',
    trim: true,
  },
  currency: {
    code: { type: String, default: 'USD' },
    symbol: { type: String, default: '$' },
  },
  shipping: {
    freeShippingThreshold: { type: Number, default: 50 },
    standardShippingFee: { type: Number, default: 10 },
  },
  paymentMethods: {
    cod: { type: Boolean, default: true },
    card: { type: Boolean, default: true },
    upi: { type: Boolean, default: true },
    netbanking: { type: Boolean, default: true },
  },
  announcement: {
    enabled: { type: Boolean, default: true },
    message: { type: String, default: 'Free Express Shipping on all orders over $50! Use code SAVE10 for 10% off.' },
  },
}, {
  timestamps: true,
});

export const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
