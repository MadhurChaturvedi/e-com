import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { cacheService } from './cacheService.js';
import { notFound, badRequest, conflict, forbidden } from '../utils/appError.js';

class OrderService {
  generateOrderNumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${dateStr}-${randomHex}`;
  }

  async createOrder(userId, { shippingAddress, paymentMethod = 'cod', couponCode }) {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      throw badRequest('Your cart is empty. Add products before placing an order.');
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || !product.isActive) {
        throw badRequest(`Product "${product ? product.name : 'Unknown'}" is unavailable or inactive.`);
      }

      if (product.stockQuantity < item.quantity) {
        throw badRequest(
          `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}.`
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

    // Shipping fee calculation
    const settings = await StoreSettings.findOne().lean();
    const freeShippingThreshold = settings?.shipping?.freeShippingThreshold ?? 50;
    const standardShippingFee = settings?.shipping?.standardShippingFee ?? 10;
    const shippingCharge = subtotal >= freeShippingThreshold ? 0 : standardShippingFee;

    // Coupon validation
    let discount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (coupon) {
        const now = new Date();
        const validTime =
          (!coupon.startDate || coupon.startDate <= now) && (!coupon.expiryDate || coupon.expiryDate >= now);
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
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const total = Math.max(0, subtotal - discount + shippingCharge);

    // Atomic decrement with rollback compensation
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
        throw conflict(`Conflict updating inventory for "${item.name}". Please review your cart.`);
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

    // Create Order
    const orderNumber = this.generateOrderNumber();
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
        status: paymentMethod === 'cod' ? 'pending' : 'completed',
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

    // Clear cart
    cart.items = [];
    await cart.save();

    // Invalidate caches
    await Promise.all([
      cacheService.invalidateDashboard(),
      cacheService.invalidateProducts(),
    ]);

    return order;
  }

  async getMyOrders(userId, { page = 1, limit = 10 } = {}) {
    const currentPage = Math.max(1, parseInt(page, 10));
    const itemsPerPage = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(itemsPerPage)
        .lean(),
      Order.countDocuments({ user: userId }),
    ]);

    return { orders, total, page: currentPage, limit: itemsPerPage };
  }

  async getOrderById(id, requestingUser) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { orderNumber: id };

    const order = await Order.findOne(query).populate('user', 'name email phone');
    if (!order) {
      throw notFound('Order not found.');
    }

    if (requestingUser.role !== 'admin' && order.user._id.toString() !== requestingUser._id.toString()) {
      throw forbidden('Access denied. You do not own this order.');
    }

    return order;
  }

  async cancelMyOrder(userId, id, reason = 'Cancelled by customer') {
    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      throw notFound('Order not found.');
    }

    if (order.fulfillmentStatus === 'delivered' || order.fulfillmentStatus === 'shipped') {
      throw badRequest(`Cannot cancel order because it has already been ${order.fulfillmentStatus}.`);
    }

    if (order.fulfillmentStatus === 'cancelled') {
      throw badRequest('Order is already cancelled.');
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
          performedBy: userId,
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
    await Promise.all([
      cacheService.invalidateDashboard(),
      cacheService.invalidateProducts(),
    ]);

    return order;
  }

  async getAllOrders({ page = 1, limit = 10, status, search, startDate, endDate } = {}) {
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

    return { orders, total, page: currentPage, limit: itemsPerPage };
  }

  async updateOrderStatus(id, adminUser, { status, note, trackingCarrier, trackingNumber }) {
    const order = await Order.findById(id);
    if (!order) {
      throw notFound('Order not found.');
    }

    if (status === 'cancelled' && order.fulfillmentStatus === 'delivered') {
      throw badRequest('Cannot cancel an order that has already been delivered.');
    }

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
            performedBy: adminUser._id,
          });
        }
      }
      order.cancelledAt = new Date();
      order.cancellationReason = note || 'Cancelled by admin';
    }

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
    await Promise.all([
      cacheService.invalidateDashboard(),
      cacheService.invalidateProducts(),
    ]);

    return order;
  }
}

export const orderService = new OrderService();
