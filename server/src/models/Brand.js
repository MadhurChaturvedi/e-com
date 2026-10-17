import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  logo: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  websiteUrl: {
    type: String,
    trim: true,
    default: '',
  },
  contactInfo: {
    type: String,
    trim: true,
    default: '',
  },
  displayOrder: {
    type: Number,
    default: 0,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

export const Brand = mongoose.model('Brand', brandSchema);
