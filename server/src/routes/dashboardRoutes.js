import { Router } from 'express';
import {
  getDashboardStats,
  getSalesAnalytics,
  getTopProducts,
  getRecentOrders,
  getLowStockProducts,
  getInventoryHistory,
  getCustomers,
  toggleCustomerStatus,
} from '../controllers/dashboardController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/sales', getSalesAnalytics);
router.get('/top-products', getTopProducts);
router.get('/recent-orders', getRecentOrders);
router.get('/low-stock', getLowStockProducts);
router.get('/inventory-history', getInventoryHistory);
router.get('/customers', getCustomers);
router.patch('/customers/:id/status', toggleCustomerStatus);

export default router;
