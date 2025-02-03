import { Request, Response, NextFunction } from 'express';
import { HASS_CONFIG, RATE_LIMIT_CONFIG } from '../config/index.js';
import rateLimit from 'express-rate-limit';
import { TokenManager } from '../security/index.js';

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

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const clientIp = req.ip || req.socket.remoteAddress || '';

    const validationResult = TokenManager.validateToken(token, clientIp);

    if (!validationResult.valid) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: validationResult.error || 'Invalid token',
            timestamp: new Date().toISOString()
        });
    }

    next();
};

// Enhanced security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
    // Set strict security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:;");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
};

// Enhanced request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    // Skip validation for health check endpoints
    if (req.path === '/health' || req.path === '/mcp') {
        return next();
    }

    // Validate content type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
        return res.status(415).json({
            success: false,
            message: 'Unsupported Media Type',
            error: 'Content-Type must be application/json',
            timestamp: new Date().toISOString()
        });
    }

    // Validate request body size
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = 1024 * 1024; // 1MB limit
    if (contentLength > maxSize) {
        return res.status(413).json({
            success: false,
            message: 'Payload Too Large',
            error: `Request body must not exceed ${maxSize} bytes`,
            timestamp: new Date().toISOString()
        });
    }

    // Validate request body structure
    if (req.method !== 'GET' && req.body) {
        if (typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({
                success: false,
                message: 'Bad Request',
                error: 'Invalid request body structure',
                timestamp: new Date().toISOString()
            });
        }
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

// Enhanced error handling middleware
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }

    if (err.name === 'ForbiddenError') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
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