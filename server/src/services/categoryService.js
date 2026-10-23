import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { createSlug } from '../utils/slugify.js';
import { cacheService } from './cacheService.js';
import { notFound, badRequest } from '../utils/appError.js';

class CategoryService {
  async getCategories(userRole = 'customer') {
    const isAdmin = userRole === 'admin';
    const filter = isAdmin ? {} : { isActive: true };

    return Category.find(filter)
      .populate('parentCategory', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .lean();
  }

  async getCategoryByIdOrSlug(idOrSlug) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    const category = await Category.findOne(query).populate('parentCategory', 'name slug');
    if (!category) {
      throw notFound('Category not found.');
    }
    return category;
  }

  async createCategory(data) {
    const { name, description, image, parentCategory, displayOrder, isActive } = data;
    let slug = createSlug(name);

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

    await cacheService.invalidateCategories();
    return category;
  }

  async updateCategory(id, data) {
    const { name, description, image, parentCategory, displayOrder, isActive } = data;

    const category = await Category.findById(id);
    if (!category) {
      throw notFound('Category not found.');
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
    await cacheService.invalidateCategories();
    return category;
  }

  async deleteCategory(id) {
    const subCategories = await Category.countDocuments({ parentCategory: id });
    if (subCategories > 0) {
      throw badRequest('Cannot delete category: Subcategories are linked to it.');
    }

    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      throw badRequest(
        `Cannot delete category: ${productCount} products are assigned to it. Reassign or delete the products first.`
      );
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      throw notFound('Category not found.');
    }

    await cacheService.invalidateCategories();
    return true;
  }
}

export const categoryService = new CategoryService();
