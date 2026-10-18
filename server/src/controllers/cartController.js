import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

let cachedSettings = null;
let settingsCacheExpiry = 0;

const getStoreSettings = async () => {
  if (cachedSettings && Date.now() < settingsCacheExpiry) {
    return cachedSettings;
  }
  try {
    cachedSettings = await StoreSettings.findOne().lean();
    settingsCacheExpiry = Date.now() + 5 * 60 * 1000;
  } catch {
    cachedSettings = null;
  }
  return cachedSettings;
};

// Helper to compute cart totals with live product prices
const formatCartResponse = async (cart) => {
  let subtotal = 0;
  const items = [];

  const settings = await getStoreSettings();
  const freeShippingThreshold = settings?.shipping?.freeShippingThreshold ?? 50;
  const standardShippingFee = settings?.shipping?.standardShippingFee ?? 10;

  for (const item of cart.items) {
    if (!item.product) continue;
    const p = item.product;
    const unitPrice = p.price;
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    items.push({
      _id: item._id,
      product: {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        images: p.images,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stockQuantity: p.stockQuantity,
        SKU: p.SKU,
        isActive: p.isActive,
      },
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
};

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const formatted = await formatCartResponse(cart);
    return successResponse(res, formatted, 'Cart retrieved.');
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10));

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return errorResponse(res, 'Product is no longer available.', 404);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item exists in cart
    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId && (item.variantId?.toString() === variantId?.toString() || (!item.variantId && !variantId))
    );

    const targetQuantity = existingIndex > -1 ? cart.items[existingIndex].quantity + qty : qty;

    if (targetQuantity > product.stockQuantity) {
      return errorResponse(
        res,
        `Only ${product.stockQuantity} units available in stock. Cannot add requested quantity.`,
        400
      );
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
    const formatted = await formatCartResponse(cart);

    return successResponse(res, formatted, 'Product added to cart.');
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return errorResponse(res, 'Cart not found.', 404);
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return errorResponse(res, 'Cart item not found.', 404);
    }

    if (qty <= 0) {
      item.deleteOne();
    } else {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return errorResponse(res, 'Product is no longer available.', 400);
      }
      if (qty > product.stockQuantity) {
        return errorResponse(
          res,
          `Cannot exceed available stock of ${product.stockQuantity} units.`,
          400
        );
      }
      item.quantity = qty;
    }

    await cart.save();
    await cart.populate('items.product');
    const formatted = await formatCartResponse(cart);

    return successResponse(res, formatted, 'Cart updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return errorResponse(res, 'Cart not found.', 404);
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    await cart.populate('items.product');
    const formatted = await formatCartResponse(cart);

    return successResponse(res, formatted, 'Item removed from cart.');
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return successResponse(res, { items: [], pricing: { subtotal: 0, total: 0 } }, 'Cart cleared.');
  } catch (error) {
    next(error);
  }
};

export const mergeCart = async (req, res, next) => {
  try {
    const { guestItems = [] } = req.body;
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return getCart(req, res, next);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    for (const guestItem of guestItems) {
      const p = await Product.findById(guestItem.productId);
      if (!p || !p.isActive) continue;

      const existingIndex = cart.items.findIndex(
        i => i.product.toString() === guestItem.productId
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
            quantity: qty,
            priceAtAddition: p.price,
          });
        }
      }
    }

    await cart.save();
    await cart.populate('items.product');
    const formatted = await formatCartResponse(cart);

    return successResponse(res, formatted, 'Cart merged successfully.');
  } catch (error) {
    next(error);
  }
};
