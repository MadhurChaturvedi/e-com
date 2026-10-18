/**
 * Client Cache & Request Deduplication Manager
 * Eliminates redundant network round-trips and Vercel serverless cold starts.
 * Features:
 * - High-speed in-memory LRU cache
 * - SessionStorage persistence for persistent instant loads across tab refreshes
 * - In-flight Promise deduplication (prevents multiple components from making the same network call simultaneously)
 * - Automatic mutation invalidation
 */

const CACHE_PREFIX = 'novastore_cache_';
const MAX_MEMORY_ENTRIES = 120;
const memoryCache = new Map();
const inFlightRequests = new Map();

// URLs that are completely safe and highly beneficial to cache
const CACHEABLE_PATTERNS = [
  /^\/home(\/.*)?$/,
  /^\/categories(\/.*)?$/,
  /^\/brands(\/.*)?$/,
  /^\/banners\/active$/,
  /^\/products(\?.*)?$/,
  /^\/products\/[^/]+$/,
  /^\/products\/[^/]+\/related$/,
];

// URLs that must NEVER be cached (private user state or mutations)
const NON_CACHEABLE_PATTERNS = [
  /^\/cart/,
  /^\/orders/,
  /^\/auth/,
  /^\/wishlist/,
  /^\/admin/,
];

export const cacheManager = {
  /**
   * Determine whether an API endpoint should be cached
   */
  isCacheable(url, method = 'get') {
    if (!url || method.toLowerCase() !== 'get') return false;
    const cleanUrl = url.split('?')[0];

    // Exclude private dynamic user routes
    for (const pattern of NON_CACHEABLE_PATTERNS) {
      if (pattern.test(cleanUrl)) return false;
    }

    // Include whitelisted public routes
    for (const pattern of CACHEABLE_PATTERNS) {
      if (pattern.test(url) || pattern.test(cleanUrl)) return true;
    }

    return false;
  },

  /**
   * Retrieve cached data if valid
   */
  get(key) {
    if (!key) return null;

    // 1. Check memory cache first
    const memoryItem = memoryCache.get(key);
    if (memoryItem) {
      if (Date.now() < memoryItem.expiry) {
        return memoryItem.data;
      }
      memoryCache.delete(key);
    }

    // 2. Check sessionStorage fallback
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() < parsed.expiry) {
            // Restore to memory cache for fastest subsequent access
            memoryCache.set(key, parsed);
            return parsed.data;
          }
          sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
        }
      }
    } catch {
      // Ignore sessionStorage serialization/permission errors
    }

    return null;
  },

  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {*} data - Cached payload
   * @param {number} ttlMs - Time to live in milliseconds (defaults to 3 minutes)
   */
  set(key, data, ttlMs = 180000) {
    if (!key || data === undefined) return;

    // Enforce memory cache size limit (evict oldest)
    if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
      const oldestKey = memoryCache.keys().next().value;
      memoryCache.delete(oldestKey);
    }

    const cacheEntry = {
      data,
      expiry: Date.now() + ttlMs,
      savedAt: Date.now(),
    };

    memoryCache.set(key, cacheEntry);

    // Save to sessionStorage for critical shell endpoints
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (
          key.includes('/home') ||
          key.includes('/categories') ||
          key.includes('/brands') ||
          key.includes('/banners/active')
        ) {
          sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheEntry));
        }
      }
    } catch {
      // Ignore quota exceeded errors
    }
  },

  /**
   * Deduplicate in-flight promises so multiple simultaneous calls share a single network request.
   */
  dedup(key, fetcher) {
    if (!key) return fetcher();

    // Check if identical request is already pending
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    const promise = fetcher()
      .finally(() => {
        inFlightRequests.delete(key);
      });

    inFlightRequests.set(key, promise);
    return promise;
  },

  /**
   * Invalidate caches matching a string or RegExp pattern
   */
  invalidate(pattern = null) {
    if (!pattern) {
      memoryCache.clear();
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          Object.keys(sessionStorage).forEach((k) => {
            if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
          });
        }
      } catch {}
      return;
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith(CACHE_PREFIX) && regex.test(k.replace(CACHE_PREFIX, ''))) {
            sessionStorage.removeItem(k);
          }
        });
      }
    } catch {}
  },
};
