import { body } from 'express-validator';

export const bannerValidator = [
  body('title').trim().notEmpty().withMessage('Banner title is required.'),
  body('image').trim().notEmpty().withMessage('Banner image is required.'),
  body('destinationUrl').trim().notEmpty().withMessage('Destination URL is required.'),
];

export const orderValidator = [
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Recipient name is required.'),
  body('shippingAddress.addressLine1').trim().notEmpty().withMessage('Address line 1 is required.'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required.'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required.'),
  body('shippingAddress.postalCode').trim().notEmpty().withMessage('Postal code is required.'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('paymentMethod')
    .isIn(['cod', 'card', 'upi', 'netbanking'])
    .withMessage('Valid payment method is required.'),
];

export const orderStatusValidator = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status transition.'),
  body('note').optional().trim(),
];

export const couponValidator = [
  body('code').trim().notEmpty().withMessage('Coupon code is required.'),
  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed.'),
  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number.'),
];
