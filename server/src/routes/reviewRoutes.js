import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProductReviews,
  createReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.get('/products/:productId', getProductReviews);

router.post(
  '/products/:productId',
  requireAuth,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
    body('comment').trim().notEmpty().withMessage('Review comment is required.'),
  ],
  validate,
  createReview
);

router.delete('/:id', requireAuth, deleteReview);

export default router;
