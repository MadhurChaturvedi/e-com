import { Wishlist } from '../models/Wishlist.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      populate: [
        { path: 'categoryId', select: 'name slug' },
        { path: 'brandId', select: 'name slug' },
      ],
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Filter out products that may have been permanently deleted
    const validProducts = wishlist.products.filter(p => p != null);
    if (validProducts.length !== wishlist.products.length) {
      wishlist.products = validProducts.map(p => p._id);
      await wishlist.save();
    }

    return successResponse(res, validProducts, 'Wishlist retrieved.');
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const updated = await Wishlist.findOne({ user: req.user._id }).populate('products');
    return successResponse(res, updated.products, 'Added to wishlist.');
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
    }

    const updated = await Wishlist.findOne({ user: req.user._id }).populate('products');
    return successResponse(res, updated?.products || [], 'Removed from wishlist.');
  } catch (error) {
    next(error);
  }
};

export const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product || !product.isActive || product.stockQuantity < 1) {
      return errorResponse(res, 'Product is currently out of stock or unavailable.', 400);
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (existingIndex > -1) {
      if (cart.items[existingIndex].quantity + 1 <= product.stockQuantity) {
        cart.items[existingIndex].quantity += 1;
      }
    } else {
      cart.items.push({
        product: product._id,
        quantity: 1,
        priceAtAddition: product.price,
      });
    }
    await cart.save();

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
    }

    const updatedWishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    return successResponse(
      res,
      { wishlist: updatedWishlist?.products || [] },
      'Product moved to cart successfully.'
    );
  } catch (error) {
    next(error);
  }
};
