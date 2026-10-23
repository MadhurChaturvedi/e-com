import { wishlistService } from '../services/wishlistService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getWishlist = async (req, res, next) => {
  try {
    const products = await wishlistService.getWishlist(req.user._id);
    return successResponse(res, products, 'Wishlist retrieved.');
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const products = await wishlistService.addToWishlist(req.user._id, req.body.productId);
    return successResponse(res, products, 'Added to wishlist.');
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const products = await wishlistService.removeFromWishlist(req.user._id, req.params.productId);
    return successResponse(res, products, 'Removed from wishlist.');
  } catch (error) {
    next(error);
  }
};

export const moveToCart = async (req, res, next) => {
  try {
    const products = await wishlistService.moveToCart(req.user._id, req.params.productId);
    return successResponse(res, { wishlist: products }, 'Product moved to cart successfully.');
  } catch (error) {
    next(error);
  }
};
