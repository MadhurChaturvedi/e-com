import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import { storageService } from './services/storageService.js';

const app = express();
app.set('trust proxy', env.TRUST_PROXY);

app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows client to load uploaded images
  })
);

// CORS configuration with credentials support
const allowedOrigins = new Set(env.CLIENT_URLS);
if (!env.IS_PRODUCTION) {
  ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'].forEach(origin =>
    allowedOrigins.add(origin)
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body and cookie parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static(storageService.getUploadDirectory()));

const healthPayload = () => ({
  status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  const payload = healthPayload();
  res.status(payload.status === 'healthy' ? 200 : 503).json(payload);
});

// Rate limiter for API
app.use('/api', apiLimiter);

app.use('/api/v1', routes);

app.get('/health', (req, res) => {
  const payload = healthPayload();
  res.status(payload.status === 'healthy' ? 200 : 503).json(payload);
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
