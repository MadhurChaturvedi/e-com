import { dashboardService } from '../services/dashboardService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    return successResponse(res, stats, 'Dashboard statistics calculated.');
  } catch (error) {
    next(error);
  }
};

export const getSalesAnalytics = async (req, res, next) => {
  try {
    const analytics = await dashboardService.getSalesAnalytics(req.query.days || 7);
    return successResponse(res, analytics, 'Sales analytics retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const topProducts = await dashboardService.getTopProducts(req.query.limit || 6);
    return successResponse(res, topProducts, 'Top products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getRecentOrders = async (req, res, next) => {
  try {
    const recentOrders = await dashboardService.getRecentOrders(req.query.limit || 6);
    return successResponse(res, recentOrders, 'Recent orders retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await dashboardService.getLowStockProducts(10, req.query.limit || 20);
    return successResponse(res, products, 'Low stock products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getInventoryHistory = async (req, res, next) => {
  try {
    const transactions = await dashboardService.getInventoryHistory(req.query.limit || 50);
    return successResponse(res, transactions, 'Inventory audit transactions retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const result = await dashboardService.getCustomers(req.query);
    return successResponse(res, result, 'Customers retrieved.');
  } catch (error) {
    next(error);
  }
};

export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const result = await dashboardService.toggleCustomerStatus(req.params.id);
    return successResponse(
      res,
      result,
      `Customer ${result.isActive ? 'activated' : 'deactivated'} successfully.`
    );
  } catch (error) {
    next(error);
  }
};
