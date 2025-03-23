import express, { Request, Response, NextFunction, Router } from 'express';
import sanitizeHtml from 'sanitize-html';

// Custom error type with status code
class SecurityError extends Error {
    constructor(public message: string, public statusCode: number) {
        super(message);
        this.name = 'SecurityError';
    }
}

// Security configuration
const SECURITY_CONFIG = {
    FRAME_OPTIONS: 'DENY',
    XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    HSTS_MAX_AGE: 31536000, // 1 year in seconds
    CSP: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"]
    },
    // Request validation config
    MAX_URL_LENGTH: 2048,
    MAX_BODY_SIZE: '1mb',
    // Rate limiting config
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 50,
        MESSAGE: 'Too many requests from this IP, please try again later.'
    },
    AUTH_RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000,
        MAX_REQUESTS: 3,
        MESSAGE: 'Too many authentication attempts from this IP, please try again later.'
    }
};

export class SecurityMiddleware {
    private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();
    private static authLimitStore = new Map<string, { count: number; resetTime: number }>();

    private static validateRequest(req: Request): void {
        // Check URL length
        if (req.originalUrl.length > SECURITY_CONFIG.MAX_URL_LENGTH) {
            throw new SecurityError('URL too long', 413);
        }

        // Check content type for POST requests
        if (req.method === 'POST' && req.headers['content-type'] !== 'application/json') {
            throw new SecurityError('Content-Type must be application/json', 415);
        }
    }

    private static sanitizeInput(input: unknown): unknown {
        if (typeof input === 'string') {
            return sanitizeHtml(input, {
                allowedTags: [],
                allowedAttributes: {}
            });
        } else if (Array.isArray(input)) {
            return input.map(item => SecurityMiddleware.sanitizeInput(item));
        } else if (input && typeof input === 'object') {
            const sanitized: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[key] = SecurityMiddleware.sanitizeInput(value);
            }
            return sanitized;
        }
        return input;
    }

    private static applySecurityHeaders(res: Response): void {
        // Remove X-Powered-By header
        res.removeHeader('X-Powered-By');

        // Set security headers
        res.setHeader('X-Frame-Options', SECURITY_CONFIG.FRAME_OPTIONS);
        res.setHeader('X-XSS-Protection', SECURITY_CONFIG.XSS_PROTECTION);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', SECURITY_CONFIG.REFERRER_POLICY);
        res.setHeader('Strict-Transport-Security', `max-age=${SECURITY_CONFIG.HSTS_MAX_AGE}; includeSubDomains; preload`);
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        res.setHeader('Origin-Agent-Cluster', '?1');

        // Set Content-Security-Policy
        const cspDirectives = Object.entries(SECURITY_CONFIG.CSP)
            .map(([key, values]) => `${key} ${values.join(' ')}`)
            .join('; ');
        res.setHeader('Content-Security-Policy', cspDirectives);
    }

    private static checkRateLimit(req: Request): void {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const isAuth = req.path.startsWith('/auth');
        const store = isAuth ? SecurityMiddleware.authLimitStore : SecurityMiddleware.rateLimitStore;
        const config = isAuth ? SECURITY_CONFIG.AUTH_RATE_LIMIT : SECURITY_CONFIG.RATE_LIMIT;

        let record = store.get(ip);
        if (!record || now > record.resetTime) {
            record = { count: 1, resetTime: now + config.WINDOW_MS };
        } else {
            record.count++;
            if (record.count > config.MAX_REQUESTS) {
                throw new SecurityError(
                    isAuth ? 'Too many authentication requests' : 'Too many requests',
                    429
                );
            }
        }

        store.set(ip, record);
    }

    /**
     * Create Express router with all security middleware
     */
    public static createRouter(): Router {
        const router = express.Router();

        // Body parser middleware with size limit
        router.use(express.json({
            limit: SECURITY_CONFIG.MAX_BODY_SIZE,
            type: 'application/json'
        }));

        // Error handler for body-parser errors
        router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
            if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.too.large') {
                res.status(413).json({
                    error: true,
                    message: 'Request body too large'
                });
            } else {
                next(err);
            }
        });

        // Main security middleware
        router.use((req: Request, res: Response, next: NextFunction) => {
            try {
                // Apply security headers
                SecurityMiddleware.applySecurityHeaders(res);

                // Check rate limits
                SecurityMiddleware.checkRateLimit(req);

                // Validate request
                SecurityMiddleware.validateRequest(req);

                // Sanitize input
                if (req.body) {
                    req.body = SecurityMiddleware.sanitizeInput(req.body);
                }

                next();
            } catch (error) {
                if (error instanceof SecurityError) {
                    res.status(error.statusCode).json({
                        error: true,
                        message: error.message
                    });
                } else {
                    res.status(500).json({
                        error: true,
                        message: 'Internal server error'
                    });
                }
            }
        });

        return router;
    }

    // For testing purposes
    public static clearRateLimits(): void {
        SecurityMiddleware.rateLimitStore.clear();
        SecurityMiddleware.authLimitStore.clear();
    }
}
