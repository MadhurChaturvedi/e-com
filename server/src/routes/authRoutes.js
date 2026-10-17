import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  addressValidator,
} from '../validators/authValidators.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfileValidator, validate, updateProfile);
router.put('/change-password', requireAuth, changePassword);

// Address sub-routes
router.post('/addresses', requireAuth, addressValidator, validate, addAddress);
router.put('/addresses/:addressId', requireAuth, addressValidator, validate, updateAddress);
router.delete('/addresses/:addressId', requireAuth, deleteAddress);

export default router;
