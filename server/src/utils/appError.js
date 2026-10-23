export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const badRequest = (message = 'Bad Request', details = null) => new AppError(message, 400, details);
export const unauthorized = (message = 'Unauthorized') => new AppError(message, 401);
export const forbidden = (message = 'Forbidden') => new AppError(message, 403);
export const notFound = (message = 'Resource not found') => new AppError(message, 404);
export const conflict = (message = 'Conflict') => new AppError(message, 409);
export const unprocessable = (message = 'Unprocessable Entity', details = null) => new AppError(message, 422, details);
