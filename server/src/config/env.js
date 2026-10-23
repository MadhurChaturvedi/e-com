import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production.');
}

const parseInteger = (name, fallback, min, max) => {
  const value = Number.parseInt(process.env[name] || String(fallback), 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
};

const clientUrlValue =
  process.env.CLIENT_URL || (nodeEnv === 'production' ? '' : 'http://localhost:5173');
const clientUrls = clientUrlValue
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

for (const value of clientUrls) {
  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`CLIENT_URL contains an invalid URL: ${value}`);
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.origin !== value) {
    throw new Error('CLIENT_URL entries must be HTTP(S) origins without paths.');
  }
  if (
    nodeEnv === 'production' &&
    parsedUrl.protocol !== 'https:' &&
    !parsedUrl.hostname.includes('localhost') &&
    parsedUrl.hostname !== '127.0.0.1'
  ) {
    throw new Error('CLIENT_URL origins must use HTTPS in production.');
  }
}

if (nodeEnv === 'production') {
  for (const name of [
    'MONGODB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ADMIN_PASSWORD',
  ]) {
    if (!process.env[name]) {
      throw new Error(`${name} must be explicitly configured in production.`);
    }
  }

  for (const name of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (process.env[name].length < 32) {
      throw new Error(`${name} must contain at least 32 characters in production.`);
    }
  }

  if (!clientUrls.length) {
    throw new Error('CLIENT_URL must contain at least one HTTPS origin in production.');
  }

  if (
    process.env.ADMIN_PASSWORD === 'Admin@123456' ||
    process.env.ADMIN_PASSWORD === 'admin@store.com' ||
    process.env.ADMIN_PASSWORD.length < 12
  ) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters and not a demo credential.');
  }
}

const trustProxy = parseInteger('TRUST_PROXY', 0, 0, 10);

export const env = {
  PORT: parseInteger('PORT', 5000, 1, 65535),
  NODE_ENV: nodeEnv,
  CLIENT_URL: clientUrls[0] || '',
  CLIENT_URLS: clientUrls,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_key_change_in_production_123',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_change_in_production_456',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: parseInteger('MAX_FILE_SIZE_MB', 5, 1, 100),
  MONGODB_MAX_POOL_SIZE: parseInteger('MONGODB_MAX_POOL_SIZE', 50, 1, 500),
  MONGODB_MIN_POOL_SIZE: parseInteger('MONGODB_MIN_POOL_SIZE', 0, 0, 100),
  TRUST_PROXY: trustProxy,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@store.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123456',
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false' && Boolean(process.env.REDIS_URL || process.env.REDIS_HOST),
  CACHE_TTL_DEFAULT: parseInteger('CACHE_TTL_DEFAULT', 300, 1, 86400),
  CACHE_PREFIX: process.env.CACHE_PREFIX || 'novastore:',
  IS_PRODUCTION: nodeEnv === 'production',
};

if (env.MONGODB_MIN_POOL_SIZE > env.MONGODB_MAX_POOL_SIZE) {
  throw new Error('MONGODB_MIN_POOL_SIZE cannot exceed MONGODB_MAX_POOL_SIZE.');
}
