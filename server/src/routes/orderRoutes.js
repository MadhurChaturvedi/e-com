import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { orderValidator, orderStatusValidator } from '../validators/orderValidators.js';

const router = Router();

router.use(requireAuth);

// Customer endpoints
router.post('/', orderValidator, validate, createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelMyOrder);

// Admin endpoints
router.get('/admin/all', requireAdmin, getAllOrders);
router.patch('/admin/:id/status', requireAdmin, orderStatusValidator, validate, updateOrderStatus);

export default router;
