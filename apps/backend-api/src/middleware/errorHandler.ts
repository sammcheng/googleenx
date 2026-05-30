import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '@/utils/logger.js';
import { config } from '@/config/config.js';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for better error handling
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

/**
 * Create specific error types
 */
export const createError = {
  validation: (message: string, details?: any) => 
    new AppError(message, 400, ErrorTypes.VALIDATION_ERROR),
  
  authentication: (message: string = 'Authentication required') => 
    new AppError(message, 401, ErrorTypes.AUTHENTICATION_ERROR),
  
  authorization: (message: string = 'Insufficient permissions') => 
    new AppError(message, 403, ErrorTypes.AUTHORIZATION_ERROR),
  
  notFound: (message: string = 'Resource not found') => 
    new AppError(message, 404, ErrorTypes.NOT_FOUND_ERROR),
  
  conflict: (message: string = 'Resource conflict') => 
    new AppError(message, 409, ErrorTypes.CONFLICT_ERROR),
  
  rateLimit: (message: string = 'Rate limit exceeded') => 
    new AppError(message, 429, ErrorTypes.RATE_LIMIT_ERROR),
  
  externalApi: (message: string = 'External API error') => 
    new AppError(message, 502, ErrorTypes.EXTERNAL_API_ERROR),
  
  database: (message: string = 'Database error') => 
    new AppError(message, 500, ErrorTypes.DATABASE_ERROR),
  
  internal: (message: string = 'Internal server error') => 
    new AppError(message, 500, ErrorTypes.INTERNAL_SERVER_ERROR),
};

/**
 * Handle Zod validation errors
 */
const handleZodError = (error: ZodError): { statusCode: number; message: string; details: any } => {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return {
    statusCode: 400,
    message: 'Validation failed',
    details,
  };
};

/**
 * Handle MongoDB errors
 */
const handleMongoError = (error: any): { statusCode: number; message: string; details?: any } => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      statusCode: 409,
      message: `${field} already exists`,
      details: { field, value: error.keyValue[field] },
    };
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));

    return {
      statusCode: 400,
      message: 'Validation failed',
      details,
    };
  }

  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid ID format',
      details: { field: error.path, value: error.value },
    };
  }

  return {
    statusCode: 500,
    message: 'Database error',
  };
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error: any): { statusCode: number; message: string } => {
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Invalid token',
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Token expired',
    };
  }

  return {
    statusCode: 401,
    message: 'Authentication failed',
  };
};

/**
 * Handle rate limiting errors
 */
const handleRateLimitError = (error: any): { statusCode: number; message: string; retryAfter?: string } => {
  return {
    statusCode: 429,
    message: 'Too many requests',
    retryAfter: error.retryAfter || '15 minutes',
  };
};

/**
 * Format error response
 */
const formatErrorResponse = (error: any, req: Request) => {
  const baseResponse = {
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: req.id,
    path: req.path,
    method: req.method,
  };

  // Add details if available
  if (error.details) {
    return { ...baseResponse, details: error.details };
  }

  // Add stack trace in development
  if (config.server.nodeEnv === 'development') {
    return { ...baseResponse, stack: error.stack };
  }

  return baseResponse;
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Log error
  logger.error('Error occurred', {
    requestId: req.id,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
  });

  // Handle specific error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    const zodError = handleZodError(error);
    statusCode = zodError.statusCode;
    message = zodError.message;
    details = zodError.details;
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    const mongoError = handleMongoError(error);
    statusCode = mongoError.statusCode;
    message = mongoError.message;
    details = mongoError.details;
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const jwtError = handleJWTError(error);
    statusCode = jwtError.statusCode;
    message = jwtError.message;
  } else if (error.status === 429) {
    const rateLimitError = handleRateLimitError(error);
    statusCode = rateLimitError.statusCode;
    message = rateLimitError.message;
    if (rateLimitError.retryAfter) {
      res.set('Retry-After', rateLimitError.retryAfter);
    }
  } else if (error.status) {
    statusCode = error.status;
    message = error.message;
  }

  // Don't leak error details in production
  if (config.server.nodeEnv === 'production' && statusCode === 500) {
    message = 'Internal server error';
    details = undefined;
  }

  // Send error response
  res.status(statusCode).json(formatErrorResponse({
    message,
    details,
    statusCode,
  }, req));
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Unhandled promise rejection handler
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  });
  
  // Close server gracefully
  process.exit(1);
});

/**
 * Uncaught exception handler
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
  
  // Close server gracefully
  process.exit(1);
});

export default errorHandler;
