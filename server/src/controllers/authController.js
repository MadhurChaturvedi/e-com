import { User } from '../models/User.js';
import { generateTokens, setTokenCookies, clearTokenCookies } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'customer',
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    setTokenCookies(res, accessToken, refreshToken);

    return successResponse(
      res,
      { user: user.toJSON(), accessToken },
      'Registration successful! Welcome to the store.',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    setTokenCookies(res, accessToken, refreshToken);

    return successResponse(
      res,
      { user: user.toJSON(), accessToken },
      'Logged in successfully.'
    );
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
    const { name, phone, avatar } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    return successResponse(res, { user: user.toJSON() }, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect.', 400);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, null, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const addressData = req.body;

    if (addressData.isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    return successResponse(res, { addresses: user.addresses }, 'Address added successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const { addressId } = req.params;
    const address = user.addresses.id(addressId);

    if (!address) {
      return errorResponse(res, 'Address not found.', 404);
    }

    if (req.body.isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    Object.assign(address, req.body);
    await user.save();

    return successResponse(res, { addresses: user.addresses }, 'Address updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const { addressId } = req.params;
    const address = user.addresses.id(addressId);

    if (!address) {
      return errorResponse(res, 'Address not found.', 404);
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return successResponse(res, { addresses: user.addresses }, 'Address removed successfully.');
  } catch (error) {
    next(error);
  }
};
