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
import { connectDB } from './config/db.js';
import { renderServerStatusHtml } from './views/serverStatusPage.js';

const app = express();
app.set('trust proxy', env.TRUST_PROXY);

app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Security HTTP headers configured for modern SPA + API + Dashboard operation
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https:', 'http:'],
        frameAncestors: ["'self'", 'https://vercel.com', 'https://*.vercel.app'],
      },
    },
    frameguard: false, // Allows Vercel preview crawler to capture screenshot
  })
);

// CORS configuration with credentials support
const allowedOrigins = new Set([
  ...env.CLIENT_URLS,
  'https://e-com-phi-beige.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  const lower = origin.toLowerCase();
  // Automatically allow any Vercel deployment of this frontend or preview branch
  if (lower.endsWith('.vercel.app') || lower.endsWith('.vercel.dev')) return true;
  if (lower.includes('localhost') || lower.includes('127.0.0.1')) return true;
  return false;
};

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

app.use(corsMiddleware);
app.options('*', corsMiddleware);

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
  database: {
    state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    host: mongoose.connection.host || 'unknown',
  },
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  const payload = healthPayload();
  res.status(payload.status === 'healthy' ? 200 : 503).json(payload);
});

// Ensure MongoDB connection for serverless / Vercel request lifecycle
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (err) {
    console.error('[Serverless DB Error]:', err.message);
    if (req.path === '/' || req.path.startsWith('/health')) {
      return next();
    }
    return res.status(503).json({
      success: false,
      message: 'Database connection currently unavailable. Please verify MONGODB_URI in Vercel.',
      error: err.message,
    });
  }
});

// Root Landing Route - Render High-Tech Animated Server Status Dashboard
app.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    // Non-fatal, status page will display current state gracefully
  }

  // If programmatic client asked for JSON explicitly, return JSON
  const acceptsHtml = req.accepts('html');
  const acceptsJson = req.accepts('json');
  if (!acceptsHtml && acceptsJson) {
    return res.json({
      success: true,
      service: 'NovaStore API Engine',
      status: 'operational',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      endpoints: {
        products: '/api/v1/products',
        categories: '/api/v1/categories',
        home: '/api/v1/home',
        health: '/health',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderServerStatusHtml(req));
});

// Rate limiter for API
app.use('/api', apiLimiter);

app.use('/api/v1', routes);

app.get('/health', (req, res) => {
  const payload = healthPayload();
  res.status(payload.status === 'healthy' ? 200 : 503).json(payload);
});

app.get('/api/v1/health', (req, res) => {
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
