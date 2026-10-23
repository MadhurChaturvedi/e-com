import { Router } from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/settingsController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { cacheRoute } from '../middlewares/cache.middleware.js';

const router = Router();

router.get('/public', cacheRoute(600), getPublicSettings);
router.get('/admin', requireAuth, requireAdmin, getAdminSettings);
router.put('/admin', requireAuth, requireAdmin, updateAdminSettings);

export default router;
