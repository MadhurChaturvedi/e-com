import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { createSlug } from '../utils/slugify.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getCategories = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { isActive: true };

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return successResponse(res, categories, 'Categories fetched successfully.');
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    const category = await Category.findOne(query).populate('parentCategory', 'name slug');

    if (!category) {
      return errorResponse(res, 'Category not found.', 404);
    }

    return successResponse(res, category, 'Category retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, parentCategory, displayOrder, isActive } = req.body;
    let slug = createSlug(name);

    // Ensure unique slug
    let existing = await Category.findOne({ slug });
    let counter = 1;
    while (existing) {
      slug = `${createSlug(name)}-${counter}`;
      existing = await Category.findOne({ slug });
      counter++;
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      parentCategory: parentCategory || null,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return successResponse(res, category, 'Category created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, parentCategory, displayOrder, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 'Category not found.', 404);
    }

    if (name && name !== category.name) {
      category.name = name;
      category.slug = createSlug(name);
    }
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    return successResponse(res, category, 'Category updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if subcategories exist
    const subCategories = await Category.countDocuments({ parentCategory: id });
    if (subCategories > 0) {
      return errorResponse(res, 'Cannot delete category: Subcategories are linked to it.', 400);
    }

    // Check if products exist in category
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      return errorResponse(
        res,
        `Cannot delete category: ${productCount} products are assigned to it. Reassign or delete the products first.`,
        400
      );
    }

    await Category.findByIdAndDelete(id);
    return successResponse(res, null, 'Category deleted successfully.');
  } catch (error) {
    next(error);
  }
};
