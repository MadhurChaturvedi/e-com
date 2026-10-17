import mongoose from 'mongoose';
import { env } from './env.js';

let mongoMemoryServer = null;
let connectingPromise = null;

export const connectDB = async () => {
  // If already connected, reuse existing active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, reuse in-flight promise
  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      mongoose.set('strictQuery', false);

      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
        minPoolSize: env.MONGODB_MIN_POOL_SIZE,
      });
      console.log(`[Database] Connected successfully to MongoDB: ${mongoose.connection.host}`);
      return conn;
    } catch (primaryError) {
      console.warn(
        `[Database] Configured MongoDB connection failed (${primaryError.name || 'Error'}: ${primaryError.message}).`
      );

      // If not in production, fallback seamlessly to MongoMemoryServer
      if (!env.IS_PRODUCTION) {
        try {
          console.log('[Database] Starting in-memory embedded MongoDB server for seamless zero-dependency operation...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          mongoMemoryServer = await MongoMemoryServer.create();
          const memoryUri = mongoMemoryServer.getUri();

          const conn = await mongoose.connect(memoryUri);
          console.log(`[Database] Connected to In-Memory MongoDB at: ${memoryUri}`);
          return conn;
        } catch (memError) {
          console.error('[Database] In-memory MongoDB startup failed:', memError);
          throw memError;
        }
      } else {
        throw primaryError;
      }
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('[Database] Disconnected MongoDB gracefully.');
  } catch (error) {
    console.error('[Database] Error disconnecting DB:', error);
    throw error;
  }
};
