import { cacheService } from '../services/cacheService.js';

/**
 * Express middleware for high-performance route caching.
 * @param {number} ttlSeconds - Duration in seconds to store the cached response.
 * @param {object} options - Optional config (e.g., custom key generator, condition)
 */
export const cacheRoute = (ttlSeconds = 60, options = {}) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Allow clients or developers to bypass cache with header or skip function
    const noCacheHeader = req.headers['cache-control'] === 'no-cache' || req.query.noCache === 'true';
    if (noCacheHeader || (typeof options.skip === 'function' && options.skip(req))) {
      res.setHeader('X-Cache', 'BYPASS');
      return next();
    }

    // Generate unique, resource-aligned cache key
    let cacheKey;
    if (typeof options.keyGenerator === 'function') {
      cacheKey = options.keyGenerator(req);
    } else {
      const cleanBase = (req.baseUrl || '').replace(/^\/api\/v1\/?/, '').replace(/^\//, '');
      const resource = cleanBase || 'route';
      const subPath = (req.path || '').replace(/^\//, '') || 'root';
      const queryStr = req.query && Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query).toString()}` : '';
      cacheKey = `${resource}:${subPath}${queryStr}`;
    }

    try {
      const cachedData = await cacheService.get(cacheKey);
      const cacheStatus = cacheService.getStatus();

      if (cachedData !== null && cachedData !== undefined) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Engine', cacheStatus.mode);
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=60`);
        return res.json(cachedData);
      }

      // Intercept res.json to capture response on successful 200 responses
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
          cacheService.set(cacheKey, body, ttlSeconds).catch((err) => {
            console.warn(`[CacheMiddleware] Failed to cache response for ${cacheKey}:`, err.message);
          });
        }
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Engine', cacheStatus.mode);
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=60`);
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.warn(`[CacheMiddleware] Cache error for ${cacheKey}:`, err.message);
      next();
    }
  };
};
