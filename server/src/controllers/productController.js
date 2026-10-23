import { productService } from '../services/productService.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const getProducts = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'customer';
    const result = await productService.getProducts(req.query, userRole);
    return paginatedResponse(res, result.products, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductByIdOrSlug = async (req, res, next) => {
  try {
    const product = await productService.getProductByIdOrSlug(req.params.idOrSlug);
    return successResponse(res, product, 'Product retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return successResponse(res, product, 'Product created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return successResponse(res, product, 'Product updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    return successResponse(res, null, 'Product deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export const getTrendingProducts = async (req, res, next) => {
  try {
    const products = await productService.getTrendingProducts(req.query.limit || 8);
    return successResponse(res, products, 'Trending products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await productService.getFeaturedProducts(req.query.limit || 8);
    return successResponse(res, products, 'Featured products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getBestSellers = async (req, res, next) => {
  try {
    const products = await productService.getBestSellers(req.query.limit || 8);
    return successResponse(res, products, 'Best selling products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const updateProductStatus = async (req, res, next) => {
  try {
    const product = await productService.updateProductStatus(req.params.id, req.body);
    return successResponse(res, product, 'Product status updated.');
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const related = await productService.getRelatedProducts(req.params.id, req.query.limit || 4);
    return successResponse(res, related, 'Related products retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (req, res, next) => {
  try {
    const products = await productService.getNewArrivals(req.query.limit || 8);
    return successResponse(res, products, 'New arrival products retrieved.');
  } catch (error) {
    next(error);
  }
};


