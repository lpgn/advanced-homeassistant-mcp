import { describe, expect, test } from "bun:test";
import { TokenManager, validateRequest, sanitizeInput, errorHandler, rateLimiter, securityHeaders } from '../../src/security/index.js';
import { mock, describe, it, expect, beforeEach, afterEach } from 'bun:test';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret-that-is-long-enough-for-testing-purposes';

describe('Security Module', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = TEST_SECRET;
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    describe('TokenManager', () => {
        const testToken = 'test-token';
        const encryptionKey = 'test-encryption-key-that-is-long-enough';

        test('should encrypt and decrypt tokens', () => {
            const encrypted = TokenManager.encryptToken(testToken, encryptionKey);
            expect(encrypted).toContain('aes-256-gcm:');

            const decrypted = TokenManager.decryptToken(encrypted, encryptionKey);
            expect(decrypted).toBe(testToken);
        });

        test('should validate tokens correctly', () => {
            const validToken = jwt.sign({ data: 'test' }, TEST_SECRET, { expiresIn: '1h' });
            const result = TokenManager.validateToken(validToken);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('should handle empty tokens', () => {
            const result = TokenManager.validateToken('');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid token format');
        });

        test('should handle expired tokens', () => {
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                data: 'test',
                iat: now - 7200,  // 2 hours ago
                exp: now - 3600   // expired 1 hour ago
            };
            const token = jwt.sign(payload, TEST_SECRET);
            const result = TokenManager.validateToken(token);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Token has expired');
        });

        test('should handle invalid token format', () => {
            const result = TokenManager.validateToken('invalid-token');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid token format');
        });

        test('should handle missing JWT secret', () => {
            delete process.env.JWT_SECRET;
            const payload = { data: 'test' };
            const token = jwt.sign(payload, 'some-secret');
            const result = TokenManager.validateToken(token);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('JWT secret not configured');
        });

        test('should handle rate limiting for failed attempts', () => {
            const invalidToken = 'x'.repeat(64);
            const testIp = '127.0.0.1';

            // First attempt
            const firstResult = TokenManager.validateToken(invalidToken, testIp);
            expect(firstResult.valid).toBe(false);

            // Multiple failed attempts
            for (let i = 0; i < 4; i++) {
                TokenManager.validateToken(invalidToken, testIp);
            }

            // Next attempt should be rate limited
            const limitedResult = TokenManager.validateToken(invalidToken, testIp);
            expect(limitedResult.valid).toBe(false);
            expect(limitedResult.error).toBe('Too many failed attempts. Please try again later.');
        });
    });

    describe('Request Validation', () => {
        let mockRequest: any;
        let mockResponse: any;
        let mockNext: any;

        beforeEach(() => {
            mockRequest = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: {},
                ip: '127.0.0.1'
            };

            mockResponse = {
                status: mock(() => mockResponse),
                json: mock(() => mockResponse),
                setHeader: mock(() => mockResponse),
                removeHeader: mock(() => mockResponse)
            };

            mockNext = mock(() => { });
        });

        test('should pass valid requests', () => {
            if (mockRequest.headers) {
                mockRequest.headers.authorization = 'Bearer valid-token';
            }
            const validateTokenSpy = mock(() => ({ valid: true }));
            TokenManager.validateToken = validateTokenSpy;

            validateRequest(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        test('should reject invalid content type', () => {
            if (mockRequest.headers) {
                mockRequest.headers['content-type'] = 'text/plain';
            }

            validateRequest(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(415);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unsupported Media Type',
                error: 'Content-Type must be application/json',
                timestamp: expect.any(String)
            });
        });

        test('should reject missing token', () => {
            if (mockRequest.headers) {
                delete mockRequest.headers.authorization;
            }

            validateRequest(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized',
                error: 'Missing or invalid authorization header',
                timestamp: expect.any(String)
            });
        });

        test('should reject invalid request body', () => {
            mockRequest.body = null;

            validateRequest(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Bad Request',
                error: 'Invalid request body structure',
                timestamp: expect.any(String)
            });
        });
    });

    describe('Input Sanitization', () => {
        let mockRequest: any;
        let mockResponse: any;
        let mockNext: any;

        beforeEach(() => {
            mockRequest = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: {
                    text: 'Test alert("xss")',
                    nested: {
                        html: 'img src="x" onerror="alert(1)"'
                    }
                }
            };

            mockResponse = {
                status: mock(() => mockResponse),
                json: mock(() => mockResponse)
            };

            mockNext = mock(() => { });
        });

        test('should sanitize HTML tags from request body', () => {
            sanitizeInput(mockRequest, mockResponse, mockNext);

            expect(mockRequest.body).toEqual({
                text: 'Test',
                nested: {
                    html: ''
                }
            });
            expect(mockNext).toHaveBeenCalled();
        });

        test('should handle non-object body', () => {
            mockRequest.body = 'string body';
            sanitizeInput(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Error Handler', () => {
        let mockRequest: any;
        let mockResponse: any;
        let mockNext: any;

        beforeEach(() => {
            mockRequest = {
                method: 'POST',
                ip: '127.0.0.1'
            };

            mockResponse = {
                status: mock(() => mockResponse),
                json: mock(() => mockResponse)
            };

            mockNext = mock(() => { });
        });

        test('should handle errors in production mode', () => {
            process.env.NODE_ENV = 'production';
            const error = new Error('Test error');
            errorHandler(error, mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                timestamp: expect.any(String)
            });
        });

        test('should include error message in development mode', () => {
            process.env.NODE_ENV = 'development';
            const error = new Error('Test error');
            errorHandler(error, mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                error: 'Test error',
                stack: expect.any(String),
                timestamp: expect.any(String)
            });
        });
    });

    describe('Rate Limiter', () => {
        test('should limit requests after threshold', async () => {
            const mockContext = {
                request: new Request('http://localhost', {
                    headers: new Headers({
                        'x-forwarded-for': '127.0.0.1'
                    })
                }),
                set: mock(() => { })
            };

            // Test multiple requests
            for (let i = 0; i < 100; i++) {
                await rateLimiter.derive(mockContext);
            }

            // The next request should throw
            try {
                await rateLimiter.derive(mockContext);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error instanceof Error).toBe(true);
                expect(error.message).toBe('Too many requests from this IP, please try again later');
            }
        });
    });

    describe('Security Headers', () => {
        test('should set security headers', async () => {
            const mockHeaders = new Headers();
            const mockContext = {
                request: new Request('http://localhost', {
                    headers: mockHeaders
                }),
                set: mock(() => { })
            };

            await securityHeaders.derive(mockContext);

            // Verify that security headers were set
            const headers = mockContext.request.headers;
            expect(headers.has('content-security-policy')).toBe(true);
            expect(headers.has('x-frame-options')).toBe(true);
            expect(headers.has('x-content-type-options')).toBe(true);
            expect(headers.has('referrer-policy')).toBe(true);
        });
    });
}); 