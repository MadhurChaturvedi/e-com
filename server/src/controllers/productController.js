import mongoose from 'express';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { createSlug } from '../utils/slugify.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      inStock,
      isFeatured,
      isTrending,
      search,
      sort = 'newest',
      includeInactive,
    } = req.query;

    const query = {};

    // Only admins can see inactive products if explicitly requested
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin || includeInactive !== 'true') {
      query.isActive = true;
    }

    // Category filter (supports id or slug)
    if (category) {
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        query.categoryId = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          // Include subcategories if any
          const subCats = await Category.find({ parentCategory: cat._id }).select('_id');
          const catIds = [cat._id, ...subCats.map(s => s._id)];
          query.categoryId = { $in: catIds };
        } else {
          // Category slug not found -> return empty
          return paginatedResponse(res, [], { total: 0, page: Number(page), limit: Number(limit) });
        }
      }
    }

    // Brand filter (supports id or slug)
    if (brand) {
      if (/^[0-9a-fA-F]{24}$/.test(brand)) {
        query.brandId = brand;
      } else {
        const b = await Brand.findOne({ slug: brand });
        if (b) {
          query.brandId = b._id;
        } else {
          return paginatedResponse(res, [], { total: 0, page: Number(page), limit: Number(limit) });
        }
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query.averageRating = { $gte: Number(rating) };
    }

    // Stock availability filter
    if (inStock === 'true') {
      query.stockQuantity = { $gt: 0 };
    }

    // Featured / Trending filter
    if (isFeatured === 'true') query.isFeatured = true;
    if (isTrending === 'true') query.isTrending = true;

    // Search query
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { SKU: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    switch (sort) {
      case 'price-asc':
        sortOptions = { price: 1 };
        break;
      case 'price-desc':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { averageRating: -1, reviewCount: -1 };
        break;
      case 'popular':
      case 'best-selling':
        sortOptions = { salesCount: -1, averageRating: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const itemsPerPage = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * itemsPerPage;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name slug logo')
        .sort(sortOptions)
        .skip(skip)
        .limit(itemsPerPage)
        .lean(),
      Product.countDocuments(query),
    ]);

    return paginatedResponse(res, products, {
      total,
      page: currentPage,
      limit: itemsPerPage,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    const product = await Product.findOne(query)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo');

    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    return successResponse(res, product, 'Product retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      categoryId,
      brandId,
      images,
      SKU,
      price,
      compareAtPrice,
      stockQuantity,
      specifications,
      variants,
      isTrending,
      isFeatured,
      isActive,
      tags,
    } = req.body;

    const existingSku = await Product.findOne({ SKU: SKU.toUpperCase().trim() });
    if (existingSku) {
      return errorResponse(res, `Product with SKU "${SKU}" already exists.`, 409);
    }

    let slug = createSlug(name);
    let existingSlug = await Product.findOne({ slug });
    let counter = 1;
    while (existingSlug) {
      slug = `${createSlug(name)}-${counter}`;
      existingSlug = await Product.findOne({ slug });
      counter++;
    }

    const product = await Product.create({
      name,
      slug,
      description,
      categoryId,
      brandId: brandId || null,
      images: images || [],
      SKU: SKU.toUpperCase().trim(),
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : 0,
      stockQuantity: Number(stockQuantity),
      specifications: specifications || [],
      variants: variants || [],
      isTrending: Boolean(isTrending),
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      tags: tags || [],
    });

    const populated = await Product.findById(product._id)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug');

    return successResponse(res, populated, 'Product created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    if (req.body.SKU && req.body.SKU.toUpperCase().trim() !== product.SKU) {
      const existingSku = await Product.findOne({
        SKU: req.body.SKU.toUpperCase().trim(),
        _id: { $ne: id },
      });
      if (existingSku) {
        return errorResponse(res, `SKU "${req.body.SKU}" is already in use by another product.`, 409);
      }
      product.SKU = req.body.SKU.toUpperCase().trim();
    }

    if (req.body.name && req.body.name !== product.name) {
      product.name = req.body.name;
      product.slug = createSlug(req.body.name);
    }

    const updatableFields = [
      'description',
      'categoryId',
      'brandId',
      'images',
      'price',
      'compareAtPrice',
      'stockQuantity',
      'specifications',
      'variants',
      'isTrending',
      'isFeatured',
      'isActive',
      'tags',
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    const populated = await Product.findById(product._id)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug');

    return successResponse(res, populated, 'Product updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, isTrending, isFeatured } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    if (isActive !== undefined) product.isActive = Boolean(isActive);
    if (isTrending !== undefined) product.isTrending = Boolean(isTrending);
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);

    await product.save();
    return successResponse(res, product, 'Product status updated.');
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    return successResponse(res, null, 'Product deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export const getTrendingProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '8', 10);
    const products = await Product.find({ isActive: true, isTrending: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return successResponse(res, products, 'Trending products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '8', 10);
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return successResponse(res, products, 'Featured products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '8', 10);
    // Real best sellers based on completed sales count
    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .sort({ salesCount: -1, averageRating: -1 })
      .limit(limit)
      .lean();
    return successResponse(res, products, 'Best selling products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '8', 10);
    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return successResponse(res, products, 'New arrival products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return errorResponse(res, 'Product not found.', 404);
    }

    const related = await Product.find({
      _id: { $ne: currentProduct._id },
      isActive: true,
      $or: [
        { categoryId: currentProduct.categoryId },
        ...(currentProduct.brandId ? [{ brandId: currentProduct.brandId }] : []),
      ],
    })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .limit(4)
      .lean();

    return successResponse(res, related, 'Related products retrieved.');
  } catch (error) {
    next(error);
  }
};
