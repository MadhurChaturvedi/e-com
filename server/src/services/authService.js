import { User } from '../models/User.js';
import { generateTokens } from '../utils/jwt.js';
import { conflict, unauthorized, forbidden, badRequest, notFound } from '../utils/appError.js';

class AuthService {
  async register({ name, email, password }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw conflict('An account with this email already exists.');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'customer',
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
      throw forbidden('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw unauthorized('Invalid email or password.');
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  async updateProfile(user, { name, phone, avatar }) {
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    return user.toJSON();
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw notFound('User not found.');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw badRequest('Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();
    return true;
  }

  async addAddress(user, addressData) {
    if (addressData.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();
    return user.addresses;
  }

  async updateAddress(user, addressId, updateData) {
    const address = user.addresses.id(addressId);
    if (!address) {
      throw notFound('Address not found.');
    }

    if (updateData.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    Object.assign(address, updateData);
    await user.save();
    return user.addresses;
  }

  async deleteAddress(user, addressId) {
    const address = user.addresses.id(addressId);
    if (!address) {
      throw notFound('Address not found.');
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.addresses;
  }
}

export const authService = new AuthService();
