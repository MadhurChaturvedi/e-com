/**
 * Image Optimization Utilities for NovaStore
 * Accelerates image delivery on Vercel deployments by dynamically tuning:
 * - Dimensions (w/h)
 * - Compression quality (q=75)
 * - Next-gen formats (AVIF/WebP via auto=format)
 * - Responsive srcset generation
 * - Fallbacks and relative upload normalizations
 */

const BACKEND_BASE = 'https://e-com-np3u.vercel.app';
const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=75';

/**
 * Optimizes an image URL for high performance and reduced bandwidth.
 * @param {string} url - Original image URL
 * @param {object} options - Options { width, height, quality, format, fit }
 * @returns {string} Optimized URL
 */
export const optimizeImageUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') {
    return DEFAULT_FALLBACK;
  }

  const {
    width = 400,
    height = null,
    quality = 75,
    format = 'auto',
    fit = 'crop',
  } = options;

  const trimmed = url.trim();

  // 1. Optimize Unsplash Images (seed catalog, demo hero banners, categories)
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set('auto', format);
      urlObj.searchParams.set('fit', fit);
      urlObj.searchParams.set('w', String(width));
      if (height) {
        urlObj.searchParams.set('h', String(height));
      } else {
        urlObj.searchParams.delete('h');
      }
      urlObj.searchParams.set('q', String(quality));
      return urlObj.toString();
    } catch {
      const base = trimmed.split('?')[0];
      return `${base}?auto=${format}&fit=${fit}&w=${width}&q=${quality}${height ? `&h=${height}` : ''}`;
    }
  }

  // 2. Normalize local upload URLs to point to production backend on Vercel
  if (trimmed.startsWith('/uploads/')) {
    const isBrowser = typeof window !== 'undefined';
    const isVercel = isBrowser && window.location.hostname.includes('vercel.app');
    if (isVercel) {
      return `${BACKEND_BASE}${trimmed}`;
    }
    return trimmed;
  }

  // 3. Return unchanged for data URLs or direct third-party CDN assets
  return trimmed;
};

/**
 * Generates responsive srcset string for HTML img tags.
 * Enables high-DPI (Retina) clarity without burdening mobile devices with desktop-sized images.
 * @param {string} url - Original image URL
 * @param {number[]} widths - Array of widths, e.g. [300, 600, 900]
 * @param {object} options - Additional optimization options
 * @returns {string|undefined} srcset attribute string
 */
export const getOptimizedSrcSet = (url, widths = [300, 600, 900], options = {}) => {
  if (!url || typeof url !== 'string' || !url.includes('images.unsplash.com')) {
    return undefined;
  }

  return widths
    .map(w => `${optimizeImageUrl(url, { ...options, width: w })} ${w}w`)
    .join(', ');
};

/**
 * Preload high-priority images into browser cache
 * @param {string} url
 */
export const preloadImage = (url) => {
  if (typeof window === 'undefined' || !url) return;
  const img = new Image();
  img.src = url;
};
