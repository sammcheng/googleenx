import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@shared/types';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
  };
  
  res.status(404).json(response);
};
