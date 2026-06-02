import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error privately on the server
  console.error(`[ERROR] ${req.method} ${req.url} - ${message}`, err);

  // Send a sanitized, consistent API error response
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Something went wrong on our end. Please try again later.' : message,
  });
};
