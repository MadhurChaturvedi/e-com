import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { createSlug } from '../utils/slugify.js';
import { cacheService } from './cacheService.js';
import { notFound, conflict, badRequest } from '../utils/appError.js';

class ProductService {
  /**
   * Safe regex sanitizer to prevent ReDoS / syntax errors
   */
  sanitizeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Query product catalog with filtering, sorting, and pagination
   */
  async getProducts(params = {}, userRole = 'customer') {
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
    } = params;

    const query = {};

    // Inactive filter for admin vs customer
    const isAdmin = userRole === 'admin';
    if (!isAdmin || includeInactive !== 'true') {
      query.isActive = true;
    }

    // Category filter (supports ObjectId or slug)
    if (category) {
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        query.categoryId = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          const subCats = await Category.find({ parentCategory: cat._id }).select('_id');
          const catIds = [cat._id, ...subCats.map((s) => s._id)];
          query.categoryId = { $in: catIds };
        } else {
          return { products: [], total: 0, page: Number(page), limit: Number(limit) };
        }
      }
    }

    // Brand filter (supports ObjectId or slug)
    if (brand) {
      if (/^[0-9a-fA-F]{24}$/.test(brand)) {
        query.brandId = brand;
      } else {
        const b = await Brand.findOne({ slug: brand });
        if (b) {
          query.brandId = b._id;
        } else {
          return { products: [], total: 0, page: Number(page), limit: Number(limit) };
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

    if (isFeatured === 'true') query.isFeatured = true;
    if (isTrending === 'true') query.isTrending = true;

    // Search query with safe regex escaping
    if (search && search.trim() !== '') {
      const sanitized = this.sanitizeRegex(search.trim());
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { SKU: { $regex: sanitized, $options: 'i' } },
        { tags: { $in: [new RegExp(sanitized, 'i')] } },
      ];
    }

    // Sort options
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

    return {
      products,
      total,
      page: currentPage,
      limit: itemsPerPage,
    };
  }

  /**
   * Find product by ObjectId or slug with caching support
   */
  async getProductByIdOrSlug(idOrSlug) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    const product = await Product.findOne(query)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo');

    if (!product) {
      throw notFound('Product not found.');
    }

    return product;
  }

  /**
   * Create new product and invalidate relevant caches
   */
  async createProduct(data) {
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
    } = data;

    const formattedSku = SKU.toUpperCase().trim();
    const existingSku = await Product.findOne({ SKU: formattedSku });
    if (existingSku) {
      throw conflict(`Product with SKU "${SKU}" already exists.`);
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
      SKU: formattedSku,
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

    // Invalidate caches
    await cacheService.invalidateProducts();

    return populated;
  }

  /**
   * Update product and invalidate caches
   */
  async updateProduct(id, data) {
    const product = await Product.findById(id);
    if (!product) {
      throw notFound('Product not found.');
    }

    if (data.SKU && data.SKU.toUpperCase().trim() !== product.SKU) {
      const formattedSku = data.SKU.toUpperCase().trim();
      const existingSku = await Product.findOne({
        SKU: formattedSku,
        _id: { $ne: id },
      });
      if (existingSku) {
        throw conflict(`SKU "${data.SKU}" is already in use by another product.`);
      }
      product.SKU = formattedSku;
    }

    if (data.name && data.name !== product.name) {
      product.name = data.name;
      product.slug = createSlug(data.name);
    }

    const allowedFields = [
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

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        if (field === 'price' || field === 'compareAtPrice' || field === 'stockQuantity') {
          product[field] = Number(data[field]);
        } else if (field === 'isTrending' || field === 'isFeatured' || field === 'isActive') {
          product[field] = Boolean(data[field]);
        } else {
          product[field] = data[field];
        }
      }
    });

    await product.save();

    const updated = await Product.findById(id)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug');

    await cacheService.invalidateProducts();

    return updated;
  }

  /**
   * Delete product and invalidate caches
   */
  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw notFound('Product not found.');
    }

    await Product.findByIdAndDelete(id);
    await cacheService.invalidateProducts();
    return true;
  }

  async getTrendingProducts(limit = 8) {
    return Product.find({ isActive: true, isTrending: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
  }

  async getFeaturedProducts(limit = 8) {
    return Product.find({ isActive: true, isFeatured: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
  }

  async getBestSellers(limit = 8) {
    return Product.find({ isActive: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .sort({ salesCount: -1, averageRating: -1 })
      .limit(Number(limit))
      .lean();
  }

  async updateProductStatus(id, { isActive, isTrending, isFeatured }) {
    const product = await Product.findById(id);
    if (!product) {
      throw notFound('Product not found.');
    }

    if (isActive !== undefined) product.isActive = Boolean(isActive);
    if (isTrending !== undefined) product.isTrending = Boolean(isTrending);
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);

    await product.save();
    await cacheService.invalidateProducts();
    return product;
  }

  async getRelatedProducts(id, limit = 4) {
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      throw notFound('Product not found.');
    }

    return Product.find({
      _id: { $ne: currentProduct._id },
      isActive: true,
      $or: [
        { categoryId: currentProduct.categoryId },
        ...(currentProduct.brandId ? [{ brandId: currentProduct.brandId }] : []),
      ],
    })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .limit(Number(limit))
      .lean();
  }

  async getNewArrivals(limit = 8) {
    return Product.find({ isActive: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug logo')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
  }
}

export const productService = new ProductService();
