import { authService } from '../services/authService.js';
import { setTokenCookies, clearTokenCookies } from '../utils/jwt.js';
import { successResponse } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setTokenCookies(res, accessToken, refreshToken);
    return successResponse(
      res,
      { user, accessToken },
      'Registration successful! Welcome to the store.',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setTokenCookies(res, accessToken, refreshToken);
    return successResponse(res, { user, accessToken }, 'Logged in successfully.');
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  clearTokenCookies(res);
  return successResponse(res, null, 'Logged out successfully.');
};

export const getMe = async (req, res) => {
  return successResponse(res, { user: req.user.toJSON() }, 'User profile retrieved.');
};

export const updateProfile = async (req, res, next) => {
  try {
    const updated = await authService.updateProfile(req.user, req.body);
    return successResponse(res, { user: updated }, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user._id, req.body);
    return successResponse(res, null, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const addresses = await authService.addAddress(req.user, req.body);
    return successResponse(res, { addresses }, 'Address added successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const addresses = await authService.updateAddress(req.user, req.params.addressId, req.body);
    return successResponse(res, { addresses }, 'Address updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const addresses = await authService.deleteAddress(req.user, req.params.addressId);
    return successResponse(res, { addresses }, 'Address removed successfully.');
  } catch (error) {
    next(error);
  }
};
