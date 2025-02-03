import { Request, Response, NextFunction } from 'express';
import { HASS_CONFIG, RATE_LIMIT_CONFIG } from '../config/index.js';
import rateLimit from 'express-rate-limit';
import { TokenManager } from '../security/index.js';
import sanitizeHtml from 'sanitize-html';
import helmet from 'helmet';

// Rate limiter middleware with enhanced configuration
export const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: RATE_LIMIT_CONFIG.REGULAR,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        reset_time: new Date(Date.now() + 60 * 1000).toISOString()
    },
    skipSuccessfulRequests: false, // Count all requests
    keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown' // Use IP for rate limiting
});

// WebSocket rate limiter middleware with enhanced configuration
export const wsRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: RATE_LIMIT_CONFIG.WEBSOCKET,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many WebSocket connections, please try again later.',
        reset_time: new Date(Date.now() + 60 * 1000).toISOString()
    },
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown'
});

// Authentication middleware with enhanced security
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'Missing or invalid authorization header',
            timestamp: new Date().toISOString()
        });
    }

    const token = authHeader.replace('Bearer ', '');
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

// Enhanced security headers middleware using helmet
const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'https:'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
});

// Wrapper for helmet middleware to handle mock responses in tests
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Add basic security headers for test environment
    if (process.env.NODE_ENV === 'test') {
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        return next();
    }

    return helmetMiddleware(req, res, next);
};

// Enhanced request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    // Skip validation for health check endpoints
    if (req.path === '/health' || req.path === '/mcp') {
        return next();
    }

    // Validate content type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(415).json({
                success: false,
                message: 'Unsupported Media Type',
                error: 'Content-Type must be application/json',
                timestamp: new Date().toISOString()
            });
        }
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

    // Validate authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'Missing or invalid authorization header',
            timestamp: new Date().toISOString()
        });
    }

    // Validate token
    const token = authHeader.replace('Bearer ', '');
    const validationResult = TokenManager.validateToken(token, req.ip);
    if (!validationResult.valid) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: validationResult.error || 'Invalid token',
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

// Enhanced input sanitization middleware
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) {
        const sanitizeValue = (value: unknown): unknown => {
            if (typeof value === 'string') {
                // Sanitize HTML content
                return sanitizeHtml(value, {
                    allowedTags: [], // Remove all HTML tags
                    allowedAttributes: {}, // Remove all attributes
                    textFilter: (text) => {
                        // Remove potential XSS patterns
                        return text.replace(/javascript:/gi, '')
                            .replace(/data:/gi, '')
                            .replace(/vbscript:/gi, '')
                            .replace(/on\w+=/gi, '')
                            .replace(/script/gi, '')
                            .replace(/\b(alert|confirm|prompt|exec|eval|setTimeout|setInterval)\b/gi, '');
                    }
                });
            }
            return value;
        };

        const sanitizeObject = (obj: unknown): unknown => {
            if (typeof obj !== 'object' || obj === null) {
                return sanitizeValue(obj);
            }

            if (Array.isArray(obj)) {
                return obj.map(item => sanitizeObject(item));
            }

            const sanitized: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
                // Sanitize keys
                const sanitizedKey = typeof key === 'string' ? sanitizeValue(key) as string : key;
                // Recursively sanitize values
                sanitized[sanitizedKey] = sanitizeObject(value);
            }

            return sanitized;
        };

        req.body = sanitizeObject(req.body);
    }

    next();
};

// Enhanced error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    // Log error with request context
    console.error('Error:', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Handle specific error types
    switch (err.name) {
        case 'ValidationError':
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                error: err.message,
                timestamp: new Date().toISOString()
            });

        case 'UnauthorizedError':
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
                error: err.message,
                timestamp: new Date().toISOString()
            });

        case 'ForbiddenError':
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
                error: err.message,
                timestamp: new Date().toISOString()
            });

        case 'NotFoundError':
            return res.status(404).json({
                success: false,
                message: 'Not Found',
                error: err.message,
                timestamp: new Date().toISOString()
            });

        case 'ConflictError':
            return res.status(409).json({
                success: false,
                message: 'Conflict',
                error: err.message,
                timestamp: new Date().toISOString()
            });

        default:
            // Default error response
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
                timestamp: new Date().toISOString()
            });
    }
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