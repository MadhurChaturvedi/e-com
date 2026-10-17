import { Router } from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/settingsController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/public', getPublicSettings);
router.get('/admin', requireAuth, requireAdmin, getAdminSettings);
router.put('/admin', requireAuth, requireAdmin, updateAdminSettings);

export default router;
