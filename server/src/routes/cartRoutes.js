import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
} from '../controllers/cartController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// All cart endpoints require authentication to persist in MongoDB
router.use(requireAuth);

router.get('/', getCart);
router.post('/items', addToCart);
router.patch('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);
router.post('/merge', mergeCart);

export default router;
