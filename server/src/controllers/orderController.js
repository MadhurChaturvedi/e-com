import { orderService } from '../services/orderService.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    return successResponse(res, order, 'Order placed successfully!', 201);
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getMyOrders(req.user._id, req.query);
    return paginatedResponse(res, result.orders, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    return successResponse(res, order, 'Order retrieved.');
  } catch (error) {
    next(error);
  }
};

export const cancelMyOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelMyOrder(req.user._id, req.params.id, req.body.reason);
    return successResponse(res, order, 'Order cancelled successfully.');
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    return paginatedResponse(res, result.orders, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.user, req.body);
    return successResponse(res, order, 'Order status updated successfully.');
  } catch (error) {
    next(error);
  }
};
