import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import rateLimit from 'express-rate-limit';
import { logger } from '../../infrastructure/logs/logger';

// Zod validation middleware
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

// Skip rate limiting for localhost
const skipLocalhost = (req: Request): boolean => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

// Global rate limiting
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Authentication rate limiting
export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  skip: skipLocalhost,
  message: { error: 'Demasiados intentos de acceso. Espera un momento e intenta de nuevo.' }
});

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
  });
  next();
};

// Global error handler
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error processing request: ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
    details: err.details
  });

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
