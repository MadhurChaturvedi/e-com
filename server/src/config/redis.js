import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;
let isConnected = false;
let isConnecting = false;
let hasWarnedError = false;

/**
 * Initializes and configures the Redis connection using ioredis.
 * Designed to be resilient: will not crash or block startup if Redis is unreachable.
 */
export const initRedis = () => {
  if (!env.REDIS_ENABLED || !env.REDIS_URL) {
    console.log('[Redis] Redis caching is disabled or REDIS_URL is not set. Using high-speed in-memory cache.');
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    isConnecting = true;
    hasWarnedError = false;
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 4000,
      enableReadyCheck: true,
      autoResubscribe: true,
      autoResendUnfulfilledCommands: false,
      lazyConnect: false,
      retryStrategy(times) {
        if (times > 3) {
          if (!hasWarnedError) {
            console.warn('[Redis] Connection retry limit reached. Continuing with high-speed in-memory caching.');
            hasWarnedError = true;
          }
          return null; // Stop retrying and fallback
        }
        return Math.min(times * 1000, 2000);
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connection initiated to Redis server.');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      isConnecting = false;
      hasWarnedError = false;
      console.log(`[Redis] Connected and ready to serve cache requests!`);
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      isConnecting = false;
      if (!hasWarnedError) {
        console.warn(`[Redis] Connection notice (${err.message}). Seamlessly operating with in-memory caching fallback.`);
        hasWarnedError = true;
      }
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    redisClient.on('end', () => {
      isConnected = false;
      isConnecting = false;
    });

    return redisClient;
  } catch (error) {
    console.warn(`[Redis] Failed to initialize Redis client (${error.message}). Using in-memory fallback.`);
    isConnected = false;
    isConnecting = false;
    redisClient = null;
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const isRedisReady = () => isConnected && redisClient && redisClient.status === 'ready';

export const disconnectRedis = async () => {
  if (redisClient) {
    try {
      if (['ready', 'connect'].includes(redisClient.status)) {
        await redisClient.quit();
        console.log('[Redis] Disconnected Redis gracefully.');
      } else {
        redisClient.disconnect();
      }
    } catch {
      redisClient.disconnect();
    } finally {
      isConnected = false;
      redisClient = null;
    }
  }
};
