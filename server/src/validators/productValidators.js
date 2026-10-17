import { body } from 'express-validator';

export const productValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('description').trim().notEmpty().withMessage('Product description is required.'),
  body('categoryId').isMongoId().withMessage('Valid category ID is required.'),
  body('brandId').optional({ nullable: true }).isMongoId().withMessage('Invalid brand ID.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('compareAtPrice').optional().isFloat({ min: 0 }).withMessage('Compare at price must be >= 0.'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer.'),
  body('SKU').trim().notEmpty().withMessage('SKU is required.'),
  body('images').isArray({ min: 1 }).withMessage('At least one product image is required.'),
];

export const updateProductValidator = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty.'),
  body('description').optional().trim().notEmpty().withMessage('Product description cannot be empty.'),
  body('categoryId').optional().isMongoId().withMessage('Valid category ID is required.'),
  body('brandId').optional({ nullable: true }).isMongoId().withMessage('Invalid brand ID.'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer.'),
  body('images').optional().isArray().withMessage('Images must be an array of URLs.'),
];
