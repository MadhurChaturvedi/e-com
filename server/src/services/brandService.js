import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { createSlug } from '../utils/slugify.js';
import { cacheService } from './cacheService.js';
import { notFound, badRequest } from '../utils/appError.js';

class BrandService {
  async getBrands(userRole = 'customer') {
    const isAdmin = userRole === 'admin';
    const filter = isAdmin ? {} : { isActive: true };

    return Brand.find(filter).sort({ displayOrder: 1, name: 1 }).lean();
  }

  async getBrandByIdOrSlug(idOrSlug) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    const brand = await Brand.findOne(query);
    if (!brand) {
      throw notFound('Brand not found.');
    }
    return brand;
  }

  async createBrand(data) {
    const { name, logo, description, websiteUrl, contactInfo, displayOrder, isActive } = data;
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

    await cacheService.invalidateBrands();
    return brand;
  }

  async updateBrand(id, data) {
    const { name, logo, description, websiteUrl, contactInfo, displayOrder, isActive } = data;

    const brand = await Brand.findById(id);
    if (!brand) {
      throw notFound('Brand not found.');
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
    await cacheService.invalidateBrands();
    return brand;
  }

  async deleteBrand(id) {
    const productsUsingBrand = await Product.countDocuments({ brandId: id });
    if (productsUsingBrand > 0) {
      throw badRequest(`Cannot delete brand: ${productsUsingBrand} products are associated with it.`);
    }

    const deleted = await Brand.findByIdAndDelete(id);
    if (!deleted) {
      throw notFound('Brand not found.');
    }

    await cacheService.invalidateBrands();
    return true;
  }
}

export const brandService = new BrandService();
