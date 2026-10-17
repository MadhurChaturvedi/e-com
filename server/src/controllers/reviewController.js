import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId, status: 'approved' })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, reviews, 'Product reviews retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    // Check if user already reviewed
    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      return errorResponse(res, 'You have already submitted a review for this product.', 400);
    }

    // Check if verified purchase
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
      isVerifiedPurchase: !!verifiedOrder,
      status: 'approved',
    });

    // Recalculate average rating for product
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

    const populated = await Review.findById(review._id).populate('user', 'name avatar');
    return successResponse(res, populated, 'Review posted successfully!', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return errorResponse(res, 'Review not found.', 404);
    }

    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied.', 403);
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate average rating
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

    return successResponse(res, null, 'Review deleted successfully.');
  } catch (error) {
    next(error);
  }
};
