import { Request, Response, NextFunction } from 'express';
import { HASS_CONFIG, RATE_LIMIT_CONFIG } from '../config/index.js';
import rateLimit from 'express-rate-limit';

// Rate limiter middleware
export const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: RATE_LIMIT_CONFIG.REGULAR,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        reset_time: new Date(Date.now() + 60 * 1000).toISOString()
    }
});

// WebSocket rate limiter middleware
export const wsRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: RATE_LIMIT_CONFIG.WEBSOCKET,
    message: {
        success: false,
        message: 'Too many WebSocket connections, please try again later.',
        reset_time: new Date(Date.now() + 60 * 1000).toISOString()
    }
});

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    // Validate content type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
        return res.status(415).json({
            success: false,
            message: 'Content-Type must be application/json'
        });
    }

    // Validate request body size
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 1024 * 1024) { // 1MB limit
        return res.status(413).json({
            success: false,
            message: 'Request body too large'
        });
    }

    next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) {
        // Recursively sanitize object
        const sanitizeObject = (obj: any): any => {
            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }

            if (Array.isArray(obj)) {
                return obj.map(item => sanitizeObject(item));
            }

            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                // Remove any potentially dangerous characters from keys
                const sanitizedKey = key.replace(/[<>]/g, '');
                sanitized[sanitizedKey] = sanitizeObject(value);
            }

            return sanitized;
        };

        req.body = sanitizeObject(req.body);
    }

    next();
};

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || token !== HASS_CONFIG.TOKEN) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - Invalid token'
        });
    }

    next();
};

// Error handling middleware
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            details: err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            details: err.message
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

// Export all middleware
export const middleware = {
    rateLimiter,
    wsRateLimiter,
    securityHeaders,
    validateRequest,
    sanitizeInput,
    authenticate,
    errorHandler
}; 