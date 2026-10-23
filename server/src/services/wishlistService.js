import { Wishlist } from '../models/Wishlist.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { notFound, badRequest } from '../utils/appError.js';

class WishlistService {
  async getWishlist(userId) {
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products',
      populate: [
        { path: 'categoryId', select: 'name slug' },
        { path: 'brandId', select: 'name slug' },
      ],
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    const validProducts = wishlist.products.filter((p) => p != null);
    if (validProducts.length !== wishlist.products.length) {
      wishlist.products = validProducts.map((p) => p._id);
      await wishlist.save();
    }

    return validProducts;
  }

  async addToWishlist(userId, productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw notFound('Product not found.');
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const updated = await Wishlist.findOne({ user: userId }).populate('products');
    return updated.products;
  }

  async removeFromWishlist(userId, productId) {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
      await wishlist.save();
    }

    const updated = await Wishlist.findOne({ user: userId }).populate('products');
    return updated?.products || [];
  }

  async moveToCart(userId, productId) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive || product.stockQuantity < 1) {
      throw badRequest('Product is currently out of stock or unavailable.');
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex((i) => i.product.toString() === productId);
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

    const wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
      await wishlist.save();
    }

    const updatedWishlist = await Wishlist.findOne({ user: userId }).populate('products');
    return updatedWishlist?.products || [];
  }
}

export const wishlistService = new WishlistService();
