import axios from 'axios';

const DEFAULT_PROD_API = 'https://e-com-np3u.vercel.app/api/v1';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isProd =
  import.meta.env.PROD ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'));

let API_BASE_URL = rawBaseUrl;
if (!API_BASE_URL || (isProd && API_BASE_URL.startsWith('/'))) {
  API_BASE_URL = isProd ? DEFAULT_PROD_API : '/api/v1';
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends HTTP-only cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
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

// Response interceptor to handle errors cleanly
api.interceptors.response.use(
  response => response.data,
  error => {
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

export default api;
