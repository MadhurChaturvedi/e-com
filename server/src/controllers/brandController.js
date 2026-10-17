import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { createSlug } from '../utils/slugify.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getBrands = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { isActive: true };

    const brands = await Brand.find(filter).sort({ displayOrder: 1, name: 1 }).lean();
    return successResponse(res, brands, 'Brands fetched successfully.');
  } catch (error) {
    next(error);
  }
};

export const getBrandByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    const brand = await Brand.findOne(query);

    if (!brand) {
      return errorResponse(res, 'Brand not found.', 404);
    }

    return successResponse(res, brand, 'Brand retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req, res, next) => {
  try {
    const { name, logo, description, websiteUrl, contactInfo, displayOrder, isActive } = req.body;
    let slug = createSlug(name);

    let existing = await Brand.findOne({ slug });
    let counter = 1;
    while (existing) {
      slug = `${createSlug(name)}-${counter}`;
      existing = await Brand.findOne({ slug });
      counter++;
    }

    const brand = await Brand.create({
      name,
      slug,
      logo,
      description,
      websiteUrl,
      contactInfo,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return successResponse(res, brand, 'Brand created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, logo, description, websiteUrl, contactInfo, displayOrder, isActive } = req.body;

    const brand = await Brand.findById(id);
    if (!brand) {
      return errorResponse(res, 'Brand not found.', 404);
    }

    if (name && name !== brand.name) {
      brand.name = name;
      brand.slug = createSlug(name);
    }
    if (logo !== undefined) brand.logo = logo;
    if (description !== undefined) brand.description = description;
    if (websiteUrl !== undefined) brand.websiteUrl = websiteUrl;
    if (contactInfo !== undefined) brand.contactInfo = contactInfo;
    if (displayOrder !== undefined) brand.displayOrder = displayOrder;
    if (isActive !== undefined) brand.isActive = isActive;

    await brand.save();
    return successResponse(res, brand, 'Brand updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    const productsUsingBrand = await Product.countDocuments({ brandId: id });
    if (productsUsingBrand > 0) {
      return errorResponse(
        res,
        `Cannot delete brand: ${productsUsingBrand} products are associated with it.`,
        400
      );
    }

    await Brand.findByIdAndDelete(id);
    return successResponse(res, null, 'Brand deleted successfully.');
  } catch (error) {
    next(error);
  }
};
