import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { Mock } from 'bun:test';
import {
    validateRequest,
    sanitizeInput,
    errorHandler,
    rateLimiter,
    securityHeaders
} from '../../src/security/index.js';

interface MockRequest extends Partial<Request> {
    headers: {
        'content-type'?: string;
        authorization?: string;
    };
    method: string;
    body: any;
    ip: string;
    path: string;
}

interface MockResponse extends Partial<Response> {
    status: Mock<(code: number) => MockResponse>;
    json: Mock<(body: any) => MockResponse>;
    setHeader: Mock<(name: string, value: string) => MockResponse>;
    removeHeader: Mock<(name: string) => MockResponse>;
}

describe('Security Middleware', () => {
    let mockRequest: any;
    let mockResponse: any;
    let nextFunction: any;

    beforeEach(() => {
        mockRequest = {
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST',
            body: {},
            ip: '127.0.0.1',
            path: '/api/test'
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            removeHeader: jest.fn().mockReturnThis()
        } as MockResponse;

        nextFunction = jest.fn();
    });

    describe('Request Validation', () => {
        it('should pass valid requests', () => {
            mockRequest.headers.authorization = 'Bearer valid-token';
            validateRequest(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should reject requests without authorization header', () => {
            validateRequest(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized',
                error: 'Missing or invalid authorization header',
                timestamp: expect.any(String)
            });
        });

        it('should reject requests with invalid authorization format', () => {
            mockRequest.headers.authorization = 'invalid-format';
            validateRequest(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized',
                error: 'Missing or invalid authorization header',
                timestamp: expect.any(String)
            });
        });
    });

    describe('Input Sanitization', () => {
        it('should sanitize HTML in request body', () => {
            mockRequest.body = {
                text: '<script>alert("xss")</script>Hello',
                nested: {
                    html: '<img src="x" onerror="alert(1)">World'
                }
            };
            sanitizeInput(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.body.text).toBe('Hello');
            expect(mockRequest.body.nested.html).toBe('World');
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should handle non-object bodies', () => {
            mockRequest.body = '<p>text</p>';
            sanitizeInput(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.body).toBe('text');
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should preserve non-string values', () => {
            mockRequest.body = {
                number: 123,
                boolean: true,
                array: [1, 2, 3]
            };
            sanitizeInput(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.body).toEqual({
                number: 123,
                boolean: true,
                array: [1, 2, 3]
            });
            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('Error Handler', () => {
        const originalEnv = process.env.NODE_ENV;

        afterAll(() => {
            process.env.NODE_ENV = originalEnv;
        });

        it('should handle errors in production mode', () => {
            process.env.NODE_ENV = 'production';
            const error = new Error('Test error');
            errorHandler(error, mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Internal Server Error',
                message: undefined,
                timestamp: expect.any(String)
            });
        });

        it('should include error details in development mode', () => {
            process.env.NODE_ENV = 'development';
            const error = new Error('Test error');
            errorHandler(error, mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Internal Server Error',
                message: 'Test error',
                stack: expect.any(String),
                timestamp: expect.any(String)
            });
        });

        it('should handle non-Error objects', () => {
            const error = 'String error message';
            errorHandler(error as any, mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('Rate Limiter', () => {
        it('should be configured with correct options', () => {
            expect(rateLimiter).toBeDefined();
            expect(rateLimiter.windowMs).toBeDefined();
            expect(rateLimiter.max).toBeDefined();
            expect(rateLimiter.message).toBeDefined();
        });
    });

    describe('Security Headers', () => {
        it('should set appropriate security headers', () => {
            securityHeaders(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
            expect(nextFunction).toHaveBeenCalled();
        });
    });
}); 