import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'Size', 'Color'
  option: { type: String, required: true }, // e.g., 'M', 'Black'
  sku: { type: String, trim: true },
  priceOffset: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 },
}, { _id: true });

const specificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

const productSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true,
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    default: null,
    index: true,
  },
  images: [{
    type: String,
    required: true,
  }],
  SKU: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  compareAtPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    index: true,
  },
  specifications: [specificationSchema],
  variants: [productVariantSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    index: true,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isTrending: {
    type: Boolean,
    default: false,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  salesCount: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Compound indexes for high-concurrency queries (category filtering, price sorting, trending/featured)
productSchema.index({ categoryId: 1, isActive: 1, price: 1 });
productSchema.index({ brandId: 1, isActive: 1 });
productSchema.index({ isActive: 1, isTrending: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({ isActive: 1, salesCount: -1, averageRating: -1 });

export const Product = mongoose.model('Product', productSchema);
