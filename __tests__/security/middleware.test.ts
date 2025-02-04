import { describe, it, expect } from 'bun:test';
import {
    checkRateLimit,
    validateRequestHeaders,
    sanitizeValue,
    applySecurityHeaders,
    handleError
} from '../../src/security/index.js';

describe('Security Middleware Utilities', () => {
    describe('Rate Limiter', () => {
        it('should allow requests under threshold', () => {
            const ip = '127.0.0.1';
            expect(() => checkRateLimit(ip, 10)).not.toThrow();
        });

        it('should throw when requests exceed threshold', () => {
            const ip = '127.0.0.2';

            // Simulate multiple requests
            for (let i = 0; i < 11; i++) {
                if (i < 10) {
                    expect(() => checkRateLimit(ip, 10)).not.toThrow();
                } else {
                    expect(() => checkRateLimit(ip, 10)).toThrow('Too many requests from this IP, please try again later');
                }
            }
        });

        it('should reset rate limit after window expires', async () => {
            const ip = '127.0.0.3';

            // Simulate multiple requests
            for (let i = 0; i < 11; i++) {
                if (i < 10) {
                    expect(() => checkRateLimit(ip, 10, 50)).not.toThrow();
                }
            }

            // Wait for rate limit window to expire
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should be able to make requests again
            expect(() => checkRateLimit(ip, 10, 50)).not.toThrow();
        });
    });

    describe('Request Validation', () => {
        it('should validate content type', () => {
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                }
            });

            expect(() => validateRequestHeaders(mockRequest)).not.toThrow();
        });

        it('should reject invalid content type', () => {
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                headers: {
                    'content-type': 'text/plain'
                }
            });

            expect(() => validateRequestHeaders(mockRequest)).toThrow('Content-Type must be application/json');
        });

        it('should reject large request bodies', () => {
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'content-length': '2000000'
                }
            });

            expect(() => validateRequestHeaders(mockRequest)).toThrow('Request body too large');
        });
    });

    describe('Input Sanitization', () => {
        it('should sanitize HTML tags', () => {
            const input = '<script>alert("xss")</script>Hello';
            const sanitized = sanitizeValue(input);
            expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello');
        });

        it('should sanitize nested objects', () => {
            const input = {
                text: '<script>alert("xss")</script>Hello',
                nested: {
                    html: '<img src="x" onerror="alert(1)">World'
                }
            };
            const sanitized = sanitizeValue(input);
            expect(sanitized).toEqual({
                text: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello',
                nested: {
                    html: '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;World'
                }
            });
        });

        it('should preserve non-string values', () => {
            const input = {
                number: 123,
                boolean: true,
                array: [1, 2, 3]
            };
            const sanitized = sanitizeValue(input);
            expect(sanitized).toEqual(input);
        });
    });

    describe('Security Headers', () => {
        it('should apply security headers', () => {
            const mockRequest = new Request('http://localhost');
            const headers = applySecurityHeaders(mockRequest);

            expect(headers).toBeDefined();
            expect(headers['content-security-policy']).toBeDefined();
            expect(headers['x-frame-options']).toBeDefined();
            expect(headers['x-content-type-options']).toBeDefined();
            expect(headers['referrer-policy']).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle errors in production mode', () => {
            const error = new Error('Test error');
            const result = handleError(error, 'production');

            expect(result).toEqual({
                error: true,
                message: 'Internal server error',
                timestamp: expect.any(String)
            });
        });

        it('should include error details in development mode', () => {
            const error = new Error('Test error');
            const result = handleError(error, 'development');

            expect(result).toEqual({
                error: true,
                message: 'Internal server error',
                timestamp: expect.any(String),
                error: 'Test error',
                stack: expect.any(String)
            });
        });
    });
}); 