import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('phone').optional().trim(),
];

export const addressValidator = [
  body('fullName').trim().notEmpty().withMessage('Recipient name is required.'),
  body('addressLine1').trim().notEmpty().withMessage('Street address is required.'),
  body('city').trim().notEmpty().withMessage('City is required.'),
  body('state').trim().notEmpty().withMessage('State is required.'),
  body('postalCode').trim().notEmpty().withMessage('Postal/ZIP code is required.'),
  body('phone').trim().notEmpty().withMessage('Contact phone number is required.'),
];
