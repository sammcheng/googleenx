import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

/**
 * 404 Not Found handler middleware
 * Handles requests to undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export default notFoundHandler;
