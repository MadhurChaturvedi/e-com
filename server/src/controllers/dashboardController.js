import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { successResponse } from '../utils/apiResponse.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      orderStatusCounts,
      revenueResult,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: '$fulfillmentStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            fulfillmentStatus: { $ne: 'cancelled' },
            'payment.status': { $in: ['completed', 'pending'] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.total' },
          },
        },
      ]),
      Product.countDocuments({ stockQuantity: { $lte: 10 }, isActive: true }),
    ]);

    const statusMap = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orderStatusCounts.forEach(item => {
      if (statusMap[item._id] !== undefined) {
        statusMap[item._id] = item.count;
      }
    });

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return successResponse(res, {
      totalProducts,
      totalCustomers,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingOrders: statusMap.pending,
      processingOrders: statusMap.processing,
      shippedOrders: statusMap.shipped,
      completedOrders: statusMap.delivered,
      cancelledOrders: statusMap.cancelled,
      lowStockCount: lowStockProducts,
    }, 'Dashboard statistics calculated.');
  } catch (error) {
    next(error);
  }
};

export const getSalesAnalytics = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const salesOverTime = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          fulfillmentStatus: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with 0
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const match = salesOverTime.find(s => s._id === dateStr);
      result.push({
        date: dateStr,
        revenue: match ? Math.round(match.revenue * 100) / 100 : 0,
        orders: match ? match.orders : 0,
      });
    }

    return successResponse(res, result, 'Sales analytics retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const topProducts = await Product.find({ isActive: true })
      .populate('categoryId', 'name')
      .populate('brandId', 'name')
      .sort({ salesCount: -1, averageRating: -1 })
      .limit(6)
      .lean();

    return successResponse(res, topProducts, 'Top products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getRecentOrders = async (req, res, next) => {
  try {
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return successResponse(res, recentOrders, 'Recent orders retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ stockQuantity: { $lte: 10 } })
      .populate('categoryId', 'name')
      .sort({ stockQuantity: 1 })
      .limit(20)
      .lean();

    return successResponse(res, products, 'Low stock products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getInventoryHistory = async (req, res, next) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate('product', 'name SKU images')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return successResponse(res, transactions, 'Inventory audit transactions retrieved.');
  } catch (error) {
    next(error);
  }
};

// Customer management
export const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { role: 'customer' };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [customers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      User.countDocuments(query),
    ]);

    // Attach order summary to customers
    const enhancedCustomers = await Promise.all(
      customers.map(async customer => {
        const orderStats = await Order.aggregate([
          { $match: { user: customer._id } },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              totalSpent: { $sum: '$pricing.total' },
            },
          },
        ]);
        return {
          ...customer,
          orderCount: orderStats[0]?.orderCount || 0,
          totalSpent: Math.round((orderStats[0]?.totalSpent || 0) * 100) / 100,
        };
      })
    );

    return successResponse(res, { customers: enhancedCustomers, total }, 'Customers retrieved.');
  } catch (error) {
    next(error);
  }
};

export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user || user.role === 'admin') {
      return errorResponse(res, 'Customer not found or cannot modify admin.', 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    return successResponse(
      res,
      { id: user._id, isActive: user.isActive },
      `Customer ${user.isActive ? 'activated' : 'deactivated'} successfully.`
    );
  } catch (error) {
    next(error);
  }
};
