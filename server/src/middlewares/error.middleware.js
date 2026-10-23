import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.details || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
    }));
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id: ${err.value}`;
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `File too large. Maximum size is ${env.MAX_FILE_SIZE_MB}MB.`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Too many files uploaded or unexpected field name.';
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired.';
  }

  const responsePayload = {
    success: false,
    message: statusCode >= 500 && env.IS_PRODUCTION ? 'Internal Server Error' : message,
    requestId: req.id,
  };

  if (errors) {
    responsePayload.errors = errors;
  }

  if (!env.IS_PRODUCTION && err.stack) {
    responsePayload.stack = err.stack;
  }

  console.error(
    JSON.stringify({
      level: 'error',
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode,
      message,
      stack: err.stack,
    })
  );
  res.status(statusCode).json(responsePayload);
};
