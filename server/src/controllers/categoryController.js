import { categoryService } from '../services/categoryService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getCategories = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'customer';
    const categories = await categoryService.getCategories(userRole);
    return successResponse(res, categories, 'Categories fetched successfully.');
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryByIdOrSlug(req.params.idOrSlug);
    return successResponse(res, category, 'Category retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return successResponse(res, category, 'Category created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    return successResponse(res, category, 'Category updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return successResponse(res, null, 'Category deleted successfully.');
  } catch (error) {
    next(error);
  }
};
