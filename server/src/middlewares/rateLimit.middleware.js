import rateLimit from 'express-rate-limit';

// Strict limiter for authentication attempts (e.g. login, forgot password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// General API rate limiter (calibrated for high-traffic browsing and shared NAT/office IPs)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500, // 100 req/min per IP threshold
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please slow down.',
  },
});
