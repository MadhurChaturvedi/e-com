import { brandService } from '../services/brandService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getBrands = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'customer';
    const brands = await brandService.getBrands(userRole);
    return successResponse(res, brands, 'Brands fetched successfully.');
  } catch (error) {
    next(error);
  }
};

export const getBrandByIdOrSlug = async (req, res, next) => {
  try {
    const brand = await brandService.getBrandByIdOrSlug(req.params.idOrSlug);
    return successResponse(res, brand, 'Brand retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req, res, next) => {
  try {
    const brand = await brandService.createBrand(req.body);
    return successResponse(res, brand, 'Brand created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    return successResponse(res, brand, 'Brand updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    await brandService.deleteBrand(req.params.id);
    return successResponse(res, null, 'Brand deleted successfully.');
  } catch (error) {
    next(error);
  }
};
