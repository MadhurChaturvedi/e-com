import { cartService } from '../services/cartService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getCart = async (req, res, next) => {
  try {
    const formatted = await cartService.getCart(req.user._id);
    return successResponse(res, formatted, 'Cart retrieved.');
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const formatted = await cartService.addToCart(req.user._id, req.body);
    return successResponse(res, formatted, 'Product added to cart.');
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const formatted = await cartService.updateCartItem(req.user._id, itemId, quantity);
    return successResponse(res, formatted, 'Cart updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const formatted = await cartService.removeFromCart(req.user._id, itemId);
    return successResponse(res, formatted, 'Item removed from cart.');
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const result = await cartService.clearCart(req.user._id);
    return successResponse(res, result, 'Cart cleared.');
  } catch (error) {
    next(error);
  }
};

export const mergeCart = async (req, res, next) => {
  try {
    const { guestItems = [] } = req.body;
    const formatted = await cartService.mergeCart(req.user._id, guestItems);
    return successResponse(res, formatted, 'Cart merged successfully.');
  } catch (error) {
    next(error);
  }
};
