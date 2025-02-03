import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { HelmetOptions } from 'helmet';
import jwt from 'jsonwebtoken';

// Security configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // requests per window
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting middleware
export const rateLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    message: 'Too many requests from this IP, please try again later'
});

// Security configuration
const helmetConfig: HelmetOptions = {
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'https:']
        }
    },
    dnsPrefetchControl: true,
    frameguard: true,
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: {
        policy: ['no-referrer', 'strict-origin-when-cross-origin']
    }
};

// Security headers middleware
export const securityHeaders = helmet(helmetConfig);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Security configuration
const SECURITY_CONFIG = {
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    MAX_TOKEN_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
    MIN_TOKEN_LENGTH: 32,
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
};

// Track failed authentication attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

export class TokenManager {
    /**
     * Encrypts a token using AES-256-GCM
     */
    static encryptToken(token: string, key: string): string {
        if (!token || typeof token !== 'string') {
            throw new Error('Invalid token');
        }
        if (!key || typeof key !== 'string' || key.length < 32) {
            throw new Error('Invalid encryption key');
        }

        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, key.slice(0, 32), iv);

            const encrypted = Buffer.concat([
                cipher.update(token, 'utf8'),
                cipher.final()
            ]);
            const tag = cipher.getAuthTag();

            // Format: algorithm:iv:tag:encrypted
            return `${ALGORITHM}:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
        } catch (error) {
            throw new Error('Failed to encrypt token');
        }
    }

    /**
     * Decrypts a token using AES-256-GCM
     */
    static decryptToken(encryptedToken: string, key: string): string {
        if (!encryptedToken || typeof encryptedToken !== 'string') {
            throw new Error('Invalid encrypted token');
        }
        if (!key || typeof key !== 'string' || key.length < 32) {
            throw new Error('Invalid encryption key');
        }

        try {
            const [algorithm, ivBase64, tagBase64, encryptedBase64] = encryptedToken.split(':');

            if (algorithm !== ALGORITHM || !ivBase64 || !tagBase64 || !encryptedBase64) {
                throw new Error('Invalid encrypted token format');
            }

            const iv = Buffer.from(ivBase64, 'base64');
            const tag = Buffer.from(tagBase64, 'base64');
            const encrypted = Buffer.from(encryptedBase64, 'base64');

            const decipher = crypto.createDecipheriv(ALGORITHM, key.slice(0, 32), iv);
            decipher.setAuthTag(tag);

            return Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]).toString('utf8');
        } catch (error) {
            if (error instanceof Error && error.message === 'Invalid encrypted token format') {
                throw error;
            }
            throw new Error('Invalid encrypted token');
        }
    }

    /**
     * Validates a JWT token with enhanced security checks
     */
    static validateToken(token: string | undefined | null, ip?: string): { valid: boolean; error?: string } {
        // Check basic token format
        if (!token || typeof token !== 'string') {
            return { valid: false, error: 'Invalid token format' };
        }

        // Check for token length
        if (token.length < SECURITY_CONFIG.MIN_TOKEN_LENGTH) {
            if (ip) this.recordFailedAttempt(ip);
            return { valid: false, error: 'Token length below minimum requirement' };
        }

        // Check for rate limiting
        if (ip && this.isRateLimited(ip)) {
            return { valid: false, error: 'Too many failed attempts. Please try again later.' };
        }

        // Get JWT secret
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return { valid: false, error: 'JWT secret not configured' };
        }

        try {
            // Verify token signature and decode
            const decoded = jwt.verify(token, secret, {
                algorithms: ['HS256'],
                clockTolerance: 0, // No clock skew tolerance
                ignoreExpiration: false // Always check expiration
            }) as jwt.JwtPayload;

            // Verify token structure
            if (!decoded || typeof decoded !== 'object') {
                if (ip) this.recordFailedAttempt(ip);
                return { valid: false, error: 'Invalid token structure' };
            }

            // Check required claims
            if (!decoded.exp || !decoded.iat) {
                if (ip) this.recordFailedAttempt(ip);
                return { valid: false, error: 'Token missing required claims' };
            }

            const now = Math.floor(Date.now() / 1000);

            // Check expiration
            if (decoded.exp <= now) {
                if (ip) this.recordFailedAttempt(ip);
                return { valid: false, error: 'Token has expired' };
            }

            // Check token age
            const tokenAge = (now - decoded.iat) * 1000;
            if (tokenAge > SECURITY_CONFIG.MAX_TOKEN_AGE) {
                if (ip) this.recordFailedAttempt(ip);
                return { valid: false, error: 'Token exceeds maximum age limit' };
            }

            // Reset failed attempts on successful validation
            if (ip) {
                failedAttempts.delete(ip);
            }

            return { valid: true };
        } catch (error) {
            if (ip) this.recordFailedAttempt(ip);
            if (error instanceof jwt.TokenExpiredError) {
                return { valid: false, error: 'Token has expired' };
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return { valid: false, error: 'Invalid token signature' };
            }
            return { valid: false, error: 'Token validation failed' };
        }
    }

    /**
     * Records a failed authentication attempt for rate limiting
     */
    private static recordFailedAttempt(ip?: string): void {
        if (!ip) return;

        const attempt = failedAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
        attempt.count++;
        attempt.lastAttempt = Date.now();
        failedAttempts.set(ip, attempt);
    }

    /**
     * Checks if an IP is rate limited due to too many failed attempts
     */
    private static isRateLimited(ip: string): boolean {
        const attempt = failedAttempts.get(ip);
        if (!attempt) return false;

        // Reset if lockout duration has passed
        if (Date.now() - attempt.lastAttempt >= SECURITY_CONFIG.LOCKOUT_DURATION) {
            failedAttempts.delete(ip);
            return false;
        }

        return attempt.count >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS;
    }

    /**
     * Generates a new JWT token
     */
    static generateToken(payload: Record<string, any>): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT secret not configured');
        }

        // Add required claims
        const now = Math.floor(Date.now() / 1000);
        const tokenPayload = {
            ...payload,
            iat: now,
            exp: now + Math.floor(TOKEN_EXPIRY / 1000)
        };

        return jwt.sign(tokenPayload, secret, {
            algorithm: 'HS256'
        });
    }
}

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction): Response | void {
    // Skip validation for health and MCP schema endpoints
    if (req.path === '/health' || req.path === '/mcp') {
        return next();
    }

    // Validate content type for non-GET requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'] || '';
        if (!contentType.toLowerCase().includes('application/json')) {
            return res.status(415).json({
                success: false,
                message: 'Unsupported Media Type',
                error: 'Content-Type must be application/json',
                timestamp: new Date().toISOString()
            });
        }
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

    // Validate request body for non-GET requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({
                success: false,
                message: 'Bad Request',
                error: 'Invalid request body structure',
                timestamp: new Date().toISOString()
            });
        }

        // Check request body size
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
    }

    next();
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
    if (!req.body) {
        return next();
    }

    function sanitizeValue(value: unknown): unknown {
        if (typeof value === 'string') {
            // Remove HTML tags and scripts more thoroughly
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags and content
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove style tags and content
                .replace(/<[^>]+>/g, '')                                            // Remove remaining HTML tags
                .replace(/javascript:/gi, '')                                       // Remove javascript: protocol
                .replace(/on\w+\s*=\s*(?:".*?"|'.*?'|[^"'>\s]+)/gi, '')           // Remove event handlers
                .trim();
        }
        if (Array.isArray(value)) {
            return value.map(item => sanitizeValue(item));
        }
        if (typeof value === 'object' && value !== null) {
            const sanitized: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[key] = sanitizeValue(val);
            }
            return sanitized;
        }
        return value;
    }

    req.body = sanitizeValue(req.body);
    next();
}

// Error handling middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}

// Export security middleware chain
export const securityMiddleware = [
    helmet(helmetConfig),
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100
    }),
    validateRequest,
    sanitizeInput,
    errorHandler
]; 