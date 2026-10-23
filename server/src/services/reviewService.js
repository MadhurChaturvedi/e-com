import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { notFound, badRequest, forbidden } from '../utils/appError.js';
import { cacheService } from './cacheService.js';

class ReviewService {
  async getProductReviews(productId) {
    return Review.find({ product: productId, status: 'approved' })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();
  }

  async createReview(userId, productId, { rating, title, comment }) {
    const product = await Product.findById(productId);
    if (!product) {
      throw notFound('Product not found.');
    }

    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      throw badRequest('You have already submitted a review for this product.');
    }

    const verifiedOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      fulfillmentStatus: { $in: ['delivered', 'shipped', 'processing', 'pending'] },
    });

    const review = await Review.create({
      product: productId,
      user: userId,
      order: verifiedOrder ? verifiedOrder._id : null,
      rating: Number(rating),
      title: title || '',
      comment,
      isVerifiedPurchase: Boolean(verifiedOrder),
      status: 'approved',
    });

    const stats = await Review.aggregate([
      { $match: { product: product._id, status: 'approved' } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      product.averageRating = Math.round(stats[0].averageRating * 10) / 10;
      product.reviewCount = stats[0].reviewCount;
      await product.save();
    }

    await cacheService.invalidateProducts();
    return Review.findById(review._id).populate('user', 'name avatar');
  }

  async deleteReview(id, requestingUser) {
    const review = await Review.findById(id);
    if (!review) {
      throw notFound('Review not found.');
    }

    if (requestingUser.role !== 'admin' && review.user.toString() !== requestingUser._id.toString()) {
      throw forbidden('Access denied.');
    }

    const productId = review.product;
    await review.deleteOne();

    const stats = await Review.aggregate([
      { $match: { product: productId, status: 'approved' } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const avg = stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0;
    const count = stats.length > 0 ? stats[0].reviewCount : 0;

    await Product.findByIdAndUpdate(productId, { averageRating: avg, reviewCount: count });
    await cacheService.invalidateProducts();
    return true;
  }
}

export const reviewService = new ReviewService();
