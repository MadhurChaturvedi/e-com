import { reviewService } from '../services/reviewService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getProductReviews(req.params.productId);
    return successResponse(res, reviews, 'Product reviews retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.params.productId, req.body);
    return successResponse(res, review, 'Review posted successfully!', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user);
    return successResponse(res, null, 'Review deleted successfully.');
  } catch (error) {
    next(error);
  }
};
