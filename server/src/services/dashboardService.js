import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { cacheService } from './cacheService.js';
import { notFound, badRequest } from '../utils/appError.js';

class DashboardService {
  /**
   * Fast cached admin dashboard stats (60s TTL)
   */
  async getDashboardStats() {
    return cacheService.wrap(
      'dashboard:stats',
      async () => {
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

        orderStatusCounts.forEach((item) => {
          if (statusMap[item._id] !== undefined) {
            statusMap[item._id] = item.count;
          }
        });

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        return {
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
        };
      },
      60
    );
  }

  async getSalesAnalytics(days = 7) {
    const numDays = Math.max(1, parseInt(days, 10));

    return cacheService.wrap(
      `dashboard:sales:${numDays}`,
      async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);
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

        const result = [];
        for (let i = numDays - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const match = salesOverTime.find((s) => s._id === dateStr);
          result.push({
            date: dateStr,
            revenue: match ? Math.round(match.revenue * 100) / 100 : 0,
            orders: match ? match.orders : 0,
          });
        }

        return result;
      },
      60
    );
  }

  async getTopProducts(limit = 6) {
    return cacheService.wrap(
      `dashboard:top-products:${limit}`,
      async () => {
        return Product.find({ isActive: true })
          .populate('categoryId', 'name')
          .populate('brandId', 'name')
          .sort({ salesCount: -1, averageRating: -1 })
          .limit(Number(limit))
          .lean();
      },
      120
    );
  }

  async getRecentOrders(limit = 6) {
    return Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
  }

  async getLowStockProducts(threshold = 10, limit = 20) {
    return Product.find({ stockQuantity: { $lte: Number(threshold) } })
      .populate('categoryId', 'name')
      .sort({ stockQuantity: 1 })
      .limit(Number(limit))
      .lean();
  }

  async getInventoryHistory(limit = 50) {
    return InventoryTransaction.find()
      .populate('product', 'name SKU images')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
  }

  async getCustomers({ search, page = 1, limit = 10 } = {}) {
    const query = { role: 'customer' };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const itemsPerPage = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [customers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(itemsPerPage)
        .lean(),
      User.countDocuments(query),
    ]);

    const enhancedCustomers = await Promise.all(
      customers.map(async (customer) => {
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

    return { customers: enhancedCustomers, total, page: currentPage, limit: itemsPerPage };
  }

  async toggleCustomerStatus(id) {
    const user = await User.findById(id);
    if (!user || user.role === 'admin') {
      throw notFound('Customer not found or cannot modify admin.');
    }

    user.isActive = !user.isActive;
    await user.save();
    return { id: user._id, isActive: user.isActive };
  }
}

export const dashboardService = new DashboardService();
