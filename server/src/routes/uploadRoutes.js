import { Router } from 'express';
import { uploadSingleImage, uploadMultipleImages } from '../controllers/uploadController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware.js';

const router = Router();

// Uploading media assets requires admin authentication
router.post('/single', requireAuth, requireAdmin, uploadSingle('image'), uploadSingleImage);
router.post('/multiple', requireAuth, requireAdmin, uploadMultiple('images', 8), uploadMultipleImages);

export default router;
