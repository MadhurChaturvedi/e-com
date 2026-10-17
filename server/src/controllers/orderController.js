import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';

// Generates unique order number e.g. ORD-20261011-9F2B
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${randomHex}`;
};

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod = 'cod', couponCode } = req.body;

    // Fetch user cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return errorResponse(res, 'Your cart is empty. Add products before placing an order.', 400);
    }

    // Step 1: Validate stock and calculate verified totals on server
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || !product.isActive) {
        return errorResponse(
          res,
          `Product "${product ? product.name : 'Unknown'}" is unavailable or inactive.`,
          400
        );
      }

      if (product.stockQuantity < item.quantity) {
        return errorResponse(
          res,
          `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}.`,
          400
        );
      }

      const itemPrice = product.price;
      const lineTotal = itemPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '',
        sku: product.SKU,
        price: itemPrice,
        quantity: item.quantity,
        total: lineTotal,
      });
    }

    // Step 2: Shipping fee calculation from store settings
    const settings = await StoreSettings.findOne().lean();
    const freeShippingThreshold = settings?.shipping?.freeShippingThreshold ?? 50;
    const standardShippingFee = settings?.shipping?.standardShippingFee ?? 10;
    const shippingCharge = subtotal >= freeShippingThreshold ? 0 : standardShippingFee;

    // Step 3: Coupon validation
    let discount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (coupon) {
        const now = new Date();
        const validTime = (!coupon.startDate || coupon.startDate <= now) && (!coupon.expiryDate || coupon.expiryDate >= now);
        const validLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const validMin = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

        if (validTime && validLimit && validMin) {
          appliedCouponCode = coupon.code;
          if (coupon.discountType === 'percentage') {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
              discount = coupon.maxDiscountAmount;
            }
          } else {
            discount = Math.min(coupon.discountValue, subtotal);
          }
          // Increment coupon usage
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const total = Math.max(0, subtotal - discount + shippingCharge);

    // Step 4: Atomic stock decrement with compensating rollback on conflict
    const decrementedItems = [];

    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stockQuantity: { $gte: item.quantity } },
        {
          $inc: {
            stockQuantity: -item.quantity,
            salesCount: item.quantity,
          },
        },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback all previously decremented items to preserve database integrity
        for (const prev of decrementedItems) {
          await Product.findByIdAndUpdate(prev.product, {
            $inc: { stockQuantity: prev.quantity, salesCount: -prev.quantity },
          });
          if (prev.transactionId) {
            await InventoryTransaction.deleteOne({ _id: prev.transactionId });
          }
        }
        if (appliedCouponCode) {
          await Coupon.findOneAndUpdate({ code: appliedCouponCode }, { $inc: { usedCount: -1 } });
        }
        return errorResponse(
          res,
          `Conflict updating inventory for "${item.name}". Please review your cart.`,
          409
        );
      }

      const tx = await InventoryTransaction.create({
        product: item.product,
        type: 'sale',
        quantityChanged: -item.quantity,
        previousStock: updatedProduct.stockQuantity + item.quantity,
        newStock: updatedProduct.stockQuantity,
        reason: 'Customer Order',
        performedBy: userId,
      });

      decrementedItems.push({
        product: item.product,
        quantity: item.quantity,
        transactionId: tx._id,
      });
    }

    // Step 5: Create Order
    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      user: userId,
      items: orderItems,
      shippingAddress,
      pricing: {
        subtotal,
        discount,
        shippingCharge,
        total,
      },
      coupon: {
        code: appliedCouponCode,
        discountAmount: discount,
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'completed', // Dev mode payment completed for test
        transactionId: paymentMethod === 'cod' ? '' : `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        paidAt: paymentMethod === 'cod' ? null : new Date(),
      },
      fulfillmentStatus: 'pending',
      timeline: [
        {
          status: 'pending',
          note: `Order placed successfully with ${paymentMethod.toUpperCase()} payment method.`,
          timestamp: new Date(),
        },
      ],
    });

    // Step 6: Clear cart
    cart.items = [];
    await cart.save();

    return successResponse(res, order, 'Order placed successfully!', 201);
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);

    return paginatedResponse(res, orders, { total, page, limit });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { orderNumber: id };

    const order = await Order.findOne(query).populate('user', 'name email phone');
    if (!order) {
      return errorResponse(res, 'Order not found.', 404);
    }

    // Ownership check (unless admin)
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied. You do not own this order.', 403);
    }

    return successResponse(res, order, 'Order retrieved.');
  } catch (error) {
    next(error);
  }
};

export const cancelMyOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return errorResponse(res, 'Order not found.', 404);
    }

    if (order.fulfillmentStatus === 'delivered' || order.fulfillmentStatus === 'shipped') {
      return errorResponse(
        res,
        `Cannot cancel order because it has already been ${order.fulfillmentStatus}.`,
        400
      );
    }

    if (order.fulfillmentStatus === 'cancelled') {
      return errorResponse(res, 'Order is already cancelled.', 400);
    }

    // Revert inventory
    for (const item of order.items) {
      const product = await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stockQuantity: item.quantity,
            salesCount: -item.quantity,
          },
        },
        { new: true }
      );

      if (product) {
        await InventoryTransaction.create({
          product: item.product,
          type: 'cancellation',
          quantityChanged: item.quantity,
          previousStock: product.stockQuantity - item.quantity,
          newStock: product.stockQuantity,
          reason: `Customer cancellation: ${reason}`,
          referenceOrder: order._id,
          performedBy: req.user._id,
        });
      }
    }

    order.fulfillmentStatus = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.timeline.push({
      status: 'cancelled',
      note: `Cancelled by customer: ${reason}`,
      timestamp: new Date(),
    });

    await order.save();
    return successResponse(res, order, 'Order cancelled successfully.');
  } catch (error) {
    next(error);
  }
};

// Admin order endpoints
export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;
    const query = {};

    if (status) {
      query.fulfillmentStatus = status;
    }

    if (search && search.trim()) {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search.trim(), $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const itemsPerPage = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(itemsPerPage)
        .lean(),
      Order.countDocuments(query),
    ]);

    return paginatedResponse(res, orders, { total, page: currentPage, limit: itemsPerPage });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, trackingCarrier, trackingNumber } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, 'Order not found.', 404);
    }

    // Disallow cancelling if already delivered
    if (status === 'cancelled' && order.fulfillmentStatus === 'delivered') {
      return errorResponse(res, 'Cannot cancel an order that has already been delivered.', 400);
    }

    // If transitioning to cancelled, restock inventory
    if (status === 'cancelled' && order.fulfillmentStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stockQuantity: item.quantity,
              salesCount: -item.quantity,
            },
          },
          { new: true }
        );

        if (product) {
          await InventoryTransaction.create({
            product: item.product,
            type: 'cancellation',
            quantityChanged: item.quantity,
            previousStock: product.stockQuantity - item.quantity,
            newStock: product.stockQuantity,
            reason: `Admin order cancellation: ${note || 'Admin action'}`,
            referenceOrder: order._id,
            performedBy: req.user._id,
          });
        }
      }
      order.cancelledAt = new Date();
      order.cancellationReason = note || 'Cancelled by admin';
    }

    // If delivered and was COD, mark payment completed
    if (status === 'delivered' && order.payment.method === 'cod') {
      order.payment.status = 'completed';
      order.payment.paidAt = new Date();
    }

    order.fulfillmentStatus = status;

    if (trackingCarrier || trackingNumber) {
      order.trackingInfo = {
        carrier: trackingCarrier || order.trackingInfo?.carrier || '',
        trackingNumber: trackingNumber || order.trackingInfo?.trackingNumber || '',
        estimatedDelivery: order.trackingInfo?.estimatedDelivery || null,
      };
    }

    order.timeline.push({
      status,
      note: note || `Status updated to ${status} by admin.`,
      timestamp: new Date(),
    });

    await order.save();
    return successResponse(res, order, 'Order status updated successfully.');
  } catch (error) {
    next(error);
  }
};
