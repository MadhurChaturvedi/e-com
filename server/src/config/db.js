import mongoose from 'mongoose';
import { env } from './env.js';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    // First try connecting to configured MONGODB_URI
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
      minPoolSize: env.MONGODB_MIN_POOL_SIZE,
    });
    console.log(`[Database] Connected successfully to MongoDB: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (primaryError) {
    console.warn(
      `[Database] Configured MongoDB connection failed (${primaryError.name || 'Error'}).`
    );

    // If not in production, fallback seamlessly to MongoMemoryServer
    if (!env.IS_PRODUCTION) {
      try {
        console.log('[Database] Starting in-memory embedded MongoDB server for seamless zero-dependency operation...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memoryUri = mongoMemoryServer.getUri();
        
        await mongoose.connect(memoryUri);
        console.log(`[Database] Connected to In-Memory MongoDB at: ${memoryUri}`);
        return mongoose.connection;
      } catch (memError) {
        console.error('[Database] In-memory MongoDB startup failed:', memError);
        throw memError;
      }
    } else {
      throw primaryError;
    }
  }
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
