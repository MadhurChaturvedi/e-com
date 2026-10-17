import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateTokens = (userId, role) => {
  const payload = { id: userId, role };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = env.IS_PRODUCTION || Boolean(process.env.VERCEL);

  const cookieOptions = {
    httpOnly: true,
    secure: Boolean(isProduction),
    sameSite: isProduction ? 'none' : 'lax',
  };

  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
  }

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};

export const clearTokenCookies = (res) => {
  const isProduction = env.IS_PRODUCTION || Boolean(process.env.VERCEL);
  const cookieOptions = {
    httpOnly: true,
    secure: Boolean(isProduction),
    sameSite: isProduction ? 'none' : 'lax',
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
