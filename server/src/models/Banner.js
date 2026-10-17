import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: {
    type: String,
    trim: true,
    default: '',
  },
  image: {
    type: String,
    required: true,
  },
  mobileImage: {
    type: String,
    default: '',
  },
  ctaLabel: {
    type: String,
    trim: true,
    default: 'Shop Now',
  },
  destinationUrl: {
    type: String,
    required: true,
    trim: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
    index: true,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

export const Banner = mongoose.model('Banner', bannerSchema);
