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
     * Validates a JWT token
     */
    static validateToken(token: string): boolean {
        if (!token || typeof token !== 'string') {
            return false;
        }

        try {
            const decoded = jwt.decode(token);
            if (!decoded || typeof decoded !== 'object') {
                return false;
            }

            // Check for expiration
            if (!decoded.exp) {
                return false;
            }

            const now = Math.floor(Date.now() / 1000);
            if (decoded.exp <= now) {
                return false;
            }

            // Verify signature using the secret from environment variable
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                return false;
            }

            try {
                jwt.verify(token, secret);
                return true;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }
}

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction) {
    // Skip validation for health and MCP schema endpoints
    if (req.path === '/health' || req.path === '/mcp') {
        return next();
    }

    // Validate content type
    if (req.method !== 'GET' && !req.is('application/json')) {
        return res.status(415).json({
            error: 'Unsupported Media Type - Content-Type must be application/json'
        });
    }

    // Validate token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !TokenManager.validateToken(token)) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }

    // Validate request body
    if (req.method !== 'GET' && (!req.body || typeof req.body !== 'object')) {
        return res.status(400).json({
            error: 'Invalid request body'
        });
    }

    next();
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
        const sanitized = JSON.parse(
            JSON.stringify(req.body).replace(/[<>]/g, '')
        );
        req.body = sanitized;
    }
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