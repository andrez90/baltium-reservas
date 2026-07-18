"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.requestLogger = exports.authRateLimiter = exports.globalRateLimiter = exports.validateQuery = exports.validateBody = void 0;
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../../infrastructure/logs/logger");
// Zod validation middleware
const validateBody = (schema) => {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validateQuery = validateQuery;
// Skip rate limiting for localhost
const skipLocalhost = (req) => {
    const ip = req.ip || req.socket?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};
// Global rate limiting
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    skip: skipLocalhost,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
// Authentication rate limiting
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 500,
    skip: skipLocalhost,
    message: { error: 'Demasiados intentos de acceso. Espera un momento e intenta de nuevo.' }
});
// Request logger middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
    });
    next();
};
exports.requestLogger = requestLogger;
// Global error handler
const globalErrorHandler = (err, req, res, next) => {
    logger_1.logger.error(`Error processing request: ${req.method} ${req.originalUrl}`, {
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
exports.globalErrorHandler = globalErrorHandler;
