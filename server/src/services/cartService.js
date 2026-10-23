import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { cacheService } from './cacheService.js';
import { notFound, badRequest } from '../utils/appError.js';

class CartService {
  async getStoreSettings() {
    return cacheService.wrap(
      'settings:store',
      async () => {
        return StoreSettings.findOne().lean();
      },
      600
    );
  }

  async formatCartResponse(cart) {
    let subtotal = 0;
    const items = [];

    const settings = await this.getStoreSettings();
    const freeShippingThreshold = settings?.shipping?.freeShippingThreshold ?? 50;
    const standardShippingFee = settings?.shipping?.standardShippingFee ?? 10;

    for (const item of cart.items) {
      if (!item.product) continue;
      const p = item.product;
      const unitPrice = p.price ?? 0;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      const resolvedImages = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : (typeof p.images === 'string' ? [p.images] : (p.image ? [p.image] : []));
      const primaryImage = resolvedImages[0] || p.image || '';

      items.push({
        _id: item._id,
        productId: p._id,
        product: {
          _id: p._id,
          name: p.name,
          slug: p.slug,
          images: resolvedImages,
          image: primaryImage,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          stockQuantity: p.stockQuantity,
          SKU: p.SKU,
          isActive: p.isActive,
        },
        image: primaryImage,
        images: resolvedImages,
        name: p.name,
        price: unitPrice,
        variantId: item.variantId,
        quantity: item.quantity,
        itemTotal,
        isAvailable: p.isActive && p.stockQuantity >= item.quantity,
      });
    }

    const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
    const total = subtotal + shippingFee;

    return {
      _id: cart._id,
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      pricing: {
        subtotal,
        shippingFee,
        freeShippingThreshold,
        total,
      },
    };
  }

  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    return this.formatCartResponse(cart);
  }

  async addToCart(userId, { productId, variantId, quantity = 1 }) {
    const qty = Math.max(1, parseInt(quantity, 10));

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw notFound('Product is no longer available.');
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.variantId?.toString() === variantId?.toString() || (!item.variantId && !variantId))
    );

    const targetQuantity = existingIndex > -1 ? cart.items[existingIndex].quantity + qty : qty;

    if (targetQuantity > product.stockQuantity) {
      throw badRequest(`Only ${product.stockQuantity} units available in stock. Cannot add requested quantity.`);
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = targetQuantity;
    } else {
      cart.items.push({
        product: productId,
        variantId: variantId || null,
        quantity: qty,
        priceAtAddition: product.price,
      });
    }

    await cart.save();
    await cart.populate('items.product');
    return this.formatCartResponse(cart);
  }

  async updateCartItem(userId, itemId, quantity) {
    const qty = parseInt(quantity, 10);
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw notFound('Cart not found.');
    }

    const item = cart.items.id(itemId);
    if (!item) {
      throw notFound('Cart item not found.');
    }

    if (qty <= 0) {
      item.deleteOne();
    } else {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        throw badRequest('Product is no longer available.');
      }
      if (qty > product.stockQuantity) {
        throw badRequest(`Cannot exceed available stock of ${product.stockQuantity} units.`);
      }
      item.quantity = qty;
    }

    await cart.save();
    await cart.populate('items.product');
    return this.formatCartResponse(cart);
  }

  async removeFromCart(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw notFound('Cart not found.');
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    await cart.populate('items.product');
    return this.formatCartResponse(cart);
  }

  async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return { items: [], pricing: { subtotal: 0, total: 0 } };
  }

  async mergeCart(userId, guestItems = []) {
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return this.getCart(userId);
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    for (const guestItem of guestItems) {
      const pid = guestItem.productId || guestItem.product?._id || guestItem.product || guestItem._id;
      if (!pid) continue;

      const p = await Product.findById(pid);
      if (!p || !p.isActive) continue;

      const existingIndex = cart.items.findIndex(
        (i) => i.product.toString() === pid.toString()
      );

      const qty = Math.min(
        existingIndex > -1 ? cart.items[existingIndex].quantity + (guestItem.quantity || 1) : (guestItem.quantity || 1),
        p.stockQuantity
      );

      if (qty > 0) {
        if (existingIndex > -1) {
          cart.items[existingIndex].quantity = qty;
        } else {
          cart.items.push({
            product: p._id,
            variantId: guestItem.variantId || null,
            quantity: qty,
            priceAtAddition: p.price,
          });
        }
      }
    }

    await cart.save();
    await cart.populate('items.product');
    return this.formatCartResponse(cart);
  }
}

export const cartService = new CartService();
