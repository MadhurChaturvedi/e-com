import axios from 'axios';
import { cacheManager } from '../utils/cacheManager';

const DEFAULT_PROD_API = 'https://e-com-np3u.vercel.app/api/v1';

const cleanBaseUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
  return `${trimmed}/api/v1`;
};

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isBrowser = typeof window !== 'undefined';
const isVercel = isBrowser && window.location.hostname.includes('vercel.app');
const isProd = Boolean(import.meta.env.PROD || isVercel);

let API_BASE_URL = cleanBaseUrl(rawBaseUrl);

// Never allow localhost or 127.0.0.1 when running on deployed environments (*.vercel.app or production)
const pointsToLocalhost =
  API_BASE_URL.includes('localhost') ||
  API_BASE_URL.includes('127.0.0.1') ||
  API_BASE_URL.includes('0.0.0.0');

if (!API_BASE_URL || (isProd && (API_BASE_URL.startsWith('/') || pointsToLocalhost))) {
  API_BASE_URL = isProd ? DEFAULT_PROD_API : '/api/v1';
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends HTTP-only cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20s timeout for serverless cold start tolerance
});

// Request interceptor to attach bearer token fallback if saved
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle errors cleanly with cold-start retry
api.interceptors.response.use(
  response => response.data,
  async error => {
    const originalRequest = error.config;
    // Auto-retry once if serverless backend had cold start 503 or transient network drop
    if (
      originalRequest &&
      !originalRequest._retry &&
      (error.response?.status === 503 || !error.response)
    ) {
      originalRequest._retry = true;
      await new Promise(r => setTimeout(r, 1200));
      return api(originalRequest);
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred.';
    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.errors = error.response?.data?.errors;
    return Promise.reject(customError);
  }
);

// High-speed caching & in-flight deduplication wrapper
const originalGet = api.get.bind(api);
const originalPost = api.post.bind(api);
const originalPut = api.put.bind(api);
const originalPatch = api.patch.bind(api);
const originalDelete = api.delete.bind(api);

const buildCacheKey = (url, params) => {
  if (!params || Object.keys(params).length === 0) return url;
  const queryString = new URLSearchParams(params).toString();
  return `${url}?${queryString}`;
};

api.get = (url, config = {}) => {
  const { skipCache = false, cacheTTL = 180000, params, ...restConfig } = config;

  if (skipCache || !cacheManager.isCacheable(url, 'get')) {
    return originalGet(url, { params, ...restConfig });
  }

  const cacheKey = buildCacheKey(url, params);
  const cachedData = cacheManager.get(cacheKey);

  if (cachedData !== null) {
    return Promise.resolve(cachedData);
  }

  return cacheManager.dedup(cacheKey, async () => {
    const data = await originalGet(url, { params, ...restConfig });
    if (data && data.success !== false) {
      cacheManager.set(cacheKey, data, cacheTTL);
    }
    return data;
  });
};

api.post = async (url, data, config) => {
  const res = await originalPost(url, data, config);
  const root = url.replace(/^\//, '').split('/')[0];
  if (root) cacheManager.invalidate(root);
  return res;
};

api.put = async (url, data, config) => {
  const res = await originalPut(url, data, config);
  const root = url.replace(/^\//, '').split('/')[0];
  if (root) cacheManager.invalidate(root);
  return res;
};

api.patch = async (url, data, config) => {
  const res = await originalPatch(url, data, config);
  const root = url.replace(/^\//, '').split('/')[0];
  if (root) cacheManager.invalidate(root);
  return res;
};

api.delete = async (url, config) => {
  const res = await originalDelete(url, config);
  const root = url.replace(/^\//, '').split('/')[0];
  if (root) cacheManager.invalidate(root);
  return res;
};

export default api;

