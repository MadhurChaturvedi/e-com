import { body } from 'express-validator';

export const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required.'),
  body('parentCategory').optional({ nullable: true }).isMongoId().withMessage('Invalid parent category ID.'),
];

export const brandValidator = [
  body('name').trim().notEmpty().withMessage('Brand name is required.'),
  body('websiteUrl').optional().isURL().withMessage('Please provide a valid URL.'),
];
