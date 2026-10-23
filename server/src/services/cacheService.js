import { env } from '../config/env.js';
import { getRedisClient, isRedisReady } from '../config/redis.js';

class CacheService {
  constructor() {
    this.prefix = env.CACHE_PREFIX || 'novastore:';
    this.defaultTTL = env.CACHE_TTL_DEFAULT || 300;
    this.memoryCache = new Map();
    this.hits = 0;
    this.misses = 0;

    // Periodic sweep for expired in-memory items (every 60 seconds)
    if (typeof setInterval !== 'undefined') {
      const sweepTimer = setInterval(() => {
        this.sweepExpiredMemory();
      }, 60000);
      if (sweepTimer.unref) sweepTimer.unref();
    }
  }

  formatKey(key) {
    if (key.startsWith(this.prefix)) return key;
    return `${this.prefix}${key}`;
  }

  sweepExpiredMemory() {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt && item.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Retrieves an item from Redis or in-memory fallback.
   * Returns deserialized object/primitive, or null if missing/expired.
   */
  async get(key) {
    const fullKey = this.formatKey(key);

    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        const raw = await client.get(fullKey);
        if (raw !== null && raw !== undefined) {
          this.hits++;
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        }
      } else {
        const cached = this.memoryCache.get(fullKey);
        if (cached) {
          if (!cached.expiresAt || cached.expiresAt > Date.now()) {
            this.hits++;
            return cached.value;
          }
          this.memoryCache.delete(fullKey);
        }
      }
    } catch (err) {
      console.warn(`[CacheService] Error reading cache key "${key}":`, err.message);
    }

    this.misses++;
    return null;
  }

  /**
   * Stores an item with a time-to-live in seconds.
   */
  async set(key, value, ttlSeconds = this.defaultTTL) {
    const fullKey = this.formatKey(key);
    const ttl = Math.max(1, ttlSeconds);

    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        const serialized = JSON.stringify(value);
        await client.set(fullKey, serialized, 'EX', ttl);
      } else {
        this.memoryCache.set(fullKey, {
          value,
          expiresAt: Date.now() + ttl * 1000,
        });
      }
      return true;
    } catch (err) {
      console.warn(`[CacheService] Error setting cache key "${key}":`, err.message);
      // Fallback write to memory
      this.memoryCache.set(fullKey, {
        value,
        expiresAt: Date.now() + ttl * 1000,
      });
      return false;
    }
  }

  /**
   * Deletes a specific key.
   */
  async del(key) {
    const fullKey = this.formatKey(key);
    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        await client.del(fullKey);
      }
      this.memoryCache.delete(fullKey);
      return true;
    } catch (err) {
      console.warn(`[CacheService] Error deleting cache key "${key}":`, err.message);
      this.memoryCache.delete(fullKey);
      return false;
    }
  }

  /**
   * Deletes all keys matching a wildcard pattern using non-blocking SCAN.
   * e.g. delByPattern('products:*') or delByPattern('home:*')
   */
  async delByPattern(pattern) {
    const fullPattern = this.formatKey(pattern);

    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        let cursor = '0';
        do {
          const [nextCursor, keys] = await client.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
          cursor = nextCursor;
          if (keys && keys.length > 0) {
            await client.del(...keys);
          }
        } while (cursor !== '0');
      }

      // Memory cache pattern removal
      const regexPattern = new RegExp(
        '^' + fullPattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&').replace(/\*/g, '.*') + '$'
      );
      for (const key of this.memoryCache.keys()) {
        if (regexPattern.test(key)) {
          this.memoryCache.delete(key);
        }
      }
      return true;
    } catch (err) {
      console.warn(`[CacheService] Error deleting by pattern "${pattern}":`, err.message);
      return false;
    }
  }

  /**
   * Cache-Aside Read-Through Helper.
   * Checks cache first; if not found, runs fetcher function and caches result.
   */
  async wrap(key, fetcher, ttlSeconds = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const freshData = await fetcher();
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  }

  /**
   * Selective Invalidation Helpers for Domain Events
   */
  async invalidateHome() {
    return this.delByPattern('home:*');
  }

  async invalidateProducts() {
    await Promise.all([
      this.delByPattern('products:*'),
      this.delByPattern('home:*'),
      this.delByPattern('dashboard:*'),
    ]);
  }

  async invalidateCategories() {
    await Promise.all([
      this.delByPattern('categories:*'),
      this.delByPattern('products:*'),
      this.delByPattern('home:*'),
    ]);
  }

  async invalidateBrands() {
    await Promise.all([
      this.delByPattern('brands:*'),
      this.delByPattern('products:*'),
      this.delByPattern('home:*'),
    ]);
  }

  async invalidateBanners() {
    await Promise.all([
      this.delByPattern('banners:*'),
      this.delByPattern('home:*'),
    ]);
  }

  async invalidateDashboard() {
    return this.delByPattern('dashboard:*');
  }

  async invalidateSettings() {
    return this.delByPattern('settings:*');
  }

  /**
   * Health status inspection
   */
  getStatus() {
    const redisReady = isRedisReady();
    const client = getRedisClient();
    let host = 'localhost';
    let port = 6379;
    try {
      if (client?.options?.host) {
        host = client.options.host;
        port = client.options.port;
      } else if (env.REDIS_URL) {
        const parsed = new URL(env.REDIS_URL);
        host = parsed.hostname;
        port = parsed.port || 6379;
      }
    } catch {
      // safe fallback
    }

    return {
      mode: redisReady ? 'redis' : 'memory-fallback',
      redisConnected: redisReady,
      provider: redisReady ? 'Redis Cloud' : 'In-Memory Store',
      host,
      port,
      endpoint: `${host}:${port}`,
      memoryItemsCount: this.memoryCache.size,
      stats: {
        hits: this.hits,
        misses: this.misses,
        hitRatio: this.hits + this.misses > 0
          ? `${((this.hits / (this.hits + this.misses)) * 100).toFixed(1)}%`
          : '0%',
      },
    };
  }
}

export const cacheService = new CacheService();
