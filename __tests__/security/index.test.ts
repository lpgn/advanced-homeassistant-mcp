import { TokenManager, validateRequest, sanitizeInput, errorHandler } from '../../src/security/index.js';
import { Request, Response } from 'express';
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

        it('should encrypt and decrypt tokens', () => {
            const encrypted = TokenManager.encryptToken(testToken, encryptionKey);
            expect(encrypted).toContain('aes-256-gcm:');

            const decrypted = TokenManager.decryptToken(encrypted, encryptionKey);
            expect(decrypted).toBe(testToken);
        });

        it('should validate tokens correctly', () => {
            const validToken = jwt.sign({ data: 'test' }, TEST_SECRET, { expiresIn: '1h' });
            const result = TokenManager.validateToken(validToken);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should handle empty tokens', () => {
            const result = TokenManager.validateToken('');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid token format');
        });

        it('should handle expired tokens', () => {
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
    });

    describe('Request Validation', () => {
        let mockRequest: Partial<Request>;
        let mockResponse: Partial<Response>;
        let mockNext: jest.Mock;

        beforeEach(() => {
            mockRequest = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                } as Record<string, string>,
                body: {},
                ip: '127.0.0.1'
            };

            mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
                setHeader: jest.fn().mockReturnThis(),
                removeHeader: jest.fn().mockReturnThis()
            };

            mockNext = jest.fn();
        });

        it('should pass valid requests', () => {
            if (mockRequest.headers) {
                mockRequest.headers.authorization = 'Bearer valid-token';
            }
            jest.spyOn(TokenManager, 'validateToken').mockReturnValue({ valid: true });

            validateRequest(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
        });

        it('should reject invalid content type', () => {
            if (mockRequest.headers) {
                mockRequest.headers['content-type'] = 'text/plain';
            }

            validateRequest(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(415);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unsupported Media Type',
                error: 'Content-Type must be application/json',
                timestamp: expect.any(String)
            });
        });

        it('should reject missing token', () => {
            if (mockRequest.headers) {
                delete mockRequest.headers.authorization;
            }

            validateRequest(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized',
                error: 'Missing or invalid authorization header',
                timestamp: expect.any(String)
            });
        });

        it('should reject invalid request body', () => {
            mockRequest.body = null;

            validateRequest(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

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
        let mockRequest: Partial<Request>;
        let mockResponse: Partial<Response>;
        let mockNext: jest.Mock;

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
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            mockNext = jest.fn();
        });

        it('should sanitize HTML tags from request body', () => {
            sanitizeInput(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockRequest.body).toEqual({
                text: 'Test',
                nested: {
                    html: ''
                }
            });
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle non-object body', () => {
            mockRequest.body = 'string body';
            sanitizeInput(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Error Handler', () => {
        let mockRequest: Partial<Request>;
        let mockResponse: Partial<Response>;
        let mockNext: jest.Mock;

        beforeEach(() => {
            mockRequest = {
                method: 'POST',
                ip: '127.0.0.1'
            };

            mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            mockNext = jest.fn();
        });

        it('should handle errors in production mode', () => {
            process.env.NODE_ENV = 'production';
            const error = new Error('Test error');
            errorHandler(
                error,
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                timestamp: expect.any(String)
            });
        });

        it('should include error message in development mode', () => {
            process.env.NODE_ENV = 'development';
            const error = new Error('Test error');
            errorHandler(
                error,
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

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
}); 