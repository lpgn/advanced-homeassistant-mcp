import { Request, Response, NextFunction } from 'express';
import { middleware } from '../index';
import { TokenManager } from '../../security/index';

describe('Security Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            body: {},
            ip: '127.0.0.1',
            method: 'POST',
            is: jest.fn(),
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
        };

        nextFunction = jest.fn();
    });

    describe('authenticate', () => {
        it('should pass valid authentication', () => {
            const token = 'valid_token';
            mockRequest.headers = { authorization: `Bearer ${token}` };
            jest.spyOn(TokenManager, 'validateToken').mockReturnValue({ valid: true });

            middleware.authenticate(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should reject invalid token', () => {
            const token = 'invalid_token';
            mockRequest.headers = { authorization: `Bearer ${token}` };
            jest.spyOn(TokenManager, 'validateToken').mockReturnValue({
                valid: false,
                error: 'Invalid token'
            });

            middleware.authenticate(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Unauthorized'
                })
            );
        });

        it('should handle missing authorization header', () => {
            middleware.authenticate(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });
    });

    describe('securityHeaders', () => {
        it('should set all required security headers', () => {
            middleware.securityHeaders(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'X-Content-Type-Options',
                'nosniff'
            );
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'X-Frame-Options',
                'DENY'
            );
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Strict-Transport-Security',
                expect.stringContaining('max-age=31536000')
            );
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Security-Policy',
                expect.any(String)
            );
            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('validateRequest', () => {
        it('should pass valid requests', () => {
            mockRequest.is = jest.fn().mockReturnValue('application/json');
            mockRequest.body = { test: 'data' };
            Object.defineProperty(mockRequest, 'path', {
                get: () => '/api/test',
                configurable: true
            });

            middleware.validateRequest(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });

        it('should reject invalid content type', () => {
            mockRequest.is = jest.fn().mockReturnValue(false);
            Object.defineProperty(mockRequest, 'path', {
                get: () => '/api/test',
                configurable: true
            });

            middleware.validateRequest(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(415);
        });

        it('should reject oversized requests', () => {
            mockRequest.headers = { 'content-length': '2097152' }; // 2MB
            mockRequest.is = jest.fn().mockReturnValue('application/json');
            Object.defineProperty(mockRequest, 'path', {
                get: () => '/api/test',
                configurable: true
            });

            middleware.validateRequest(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(413);
        });

        it('should skip validation for health check endpoints', () => {
            Object.defineProperty(mockRequest, 'path', {
                get: () => '/health',
                configurable: true
            });

            middleware.validateRequest(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('sanitizeInput', () => {
        it('should sanitize HTML in request body', () => {
            mockRequest.body = {
                text: '<script>alert("xss")</script>Hello',
                nested: {
                    html: '<img src="x" onerror="alert(1)">World'
                }
            };

            middleware.sanitizeInput(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockRequest.body.text).not.toContain('<script>');
            expect(mockRequest.body.nested.html).not.toContain('<img');
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should handle non-object bodies', () => {
            mockRequest.body = '<p>text</p>';

            middleware.sanitizeInput(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockRequest.body).not.toContain('<p>');
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should preserve non-string values', () => {
            const body = {
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3]
            };
            mockRequest.body = { ...body };

            middleware.sanitizeInput(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockRequest.body).toEqual(body);
            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('errorHandler', () => {
        it('should handle ValidationError', () => {
            const error = new Error('Validation failed');
            error.name = 'ValidationError';

            middleware.errorHandler(
                error,
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Validation Error'
                })
            );
        });

        it('should handle UnauthorizedError', () => {
            const error = new Error('Unauthorized access');
            error.name = 'UnauthorizedError';

            middleware.errorHandler(
                error,
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should handle generic errors', () => {
            const error = new Error('Something went wrong');

            middleware.errorHandler(
                error,
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Internal Server Error'
                })
            );
        });

        it('should hide error details in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            const error = new Error('Sensitive error details');

            middleware.errorHandler(
                error,
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'An unexpected error occurred'
                })
            );

            process.env.NODE_ENV = originalEnv;
        });
    });
}); 