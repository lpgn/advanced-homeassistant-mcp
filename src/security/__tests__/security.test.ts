import { TokenManager } from '../index';
import { SECURITY_CONFIG } from '../../config/security.config';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

describe('TokenManager', () => {
    const validSecret = 'test_secret_key_that_is_at_least_32_chars_long';
    const testIp = '127.0.0.1';

    beforeEach(() => {
        process.env.JWT_SECRET = validSecret;
        jest.clearAllMocks();
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    describe('Token Validation', () => {
        it('should validate a properly formatted token', () => {
            const payload = { userId: '123', role: 'user' };
            const token = jwt.sign(payload, validSecret);
            const result = TokenManager.validateToken(token, testIp);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should reject an invalid token', () => {
            const result = TokenManager.validateToken('invalid_token', testIp);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Token length below minimum requirement');
        });

        it('should reject a token that is too short', () => {
            const result = TokenManager.validateToken('short', testIp);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Token length below minimum requirement');
        });

        it('should reject an expired token', () => {
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                userId: '123',
                role: 'user',
                iat: now - 7200,  // 2 hours ago
                exp: now - 3600   // expired 1 hour ago
            };
            const token = jwt.sign(payload, validSecret);
            const result = TokenManager.validateToken(token, testIp);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Token has expired');
        });

        it('should implement rate limiting for failed attempts', async () => {
            // Simulate multiple failed attempts
            for (let i = 0; i < SECURITY_CONFIG.MAX_FAILED_ATTEMPTS; i++) {
                const result = TokenManager.validateToken('invalid_token', testIp);
                expect(result.valid).toBe(false);
            }

            // Next attempt should be blocked by rate limiting
            const result = TokenManager.validateToken('invalid_token', testIp);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Too many failed attempts. Please try again later.');

            // Wait for rate limit to expire
            await new Promise(resolve => setTimeout(resolve, SECURITY_CONFIG.LOCKOUT_DURATION + 100));

            // Should be able to try again
            const validPayload = { userId: '123', role: 'user' };
            const validToken = jwt.sign(validPayload, validSecret);
            const finalResult = TokenManager.validateToken(validToken, testIp);
            expect(finalResult.valid).toBe(true);
        });
    });

    describe('Token Generation', () => {
        it('should generate a valid JWT token', () => {
            const payload = { userId: '123', role: 'user' };
            const token = TokenManager.generateToken(payload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');

            // Verify the token can be decoded
            const decoded = jwt.verify(token, validSecret) as any;
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.role).toBe(payload.role);
        });

        it('should include required claims in generated tokens', () => {
            const payload = { userId: '123' };
            const token = TokenManager.generateToken(payload);
            const decoded = jwt.verify(token, validSecret) as any;

            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeDefined();
            expect(decoded.exp - decoded.iat).toBe(
                Math.floor(24 * 60 * 60) // 24 hours in seconds
            );
        });

        it('should throw error when JWT secret is not configured', () => {
            delete process.env.JWT_SECRET;
            const payload = { userId: '123' };
            expect(() => TokenManager.generateToken(payload)).toThrow('JWT secret not configured');
        });
    });

    describe('Token Encryption', () => {
        const encryptionKey = 'encryption_key_that_is_at_least_32_chars_long';

        it('should encrypt and decrypt a token successfully', () => {
            const originalToken = 'test_token_to_encrypt';
            const encrypted = TokenManager.encryptToken(originalToken, encryptionKey);
            const decrypted = TokenManager.decryptToken(encrypted, encryptionKey);
            expect(decrypted).toBe(originalToken);
        });

        it('should throw error for invalid encryption inputs', () => {
            expect(() => TokenManager.encryptToken('', encryptionKey)).toThrow('Invalid token');
            expect(() => TokenManager.encryptToken('valid_token', '')).toThrow('Invalid encryption key');
        });

        it('should throw error for invalid decryption inputs', () => {
            expect(() => TokenManager.decryptToken('', encryptionKey)).toThrow('Invalid encrypted token');
            expect(() => TokenManager.decryptToken('invalid:format', encryptionKey)).toThrow('Invalid encrypted token format');
        });

        it('should generate different ciphertexts for same plaintext', () => {
            const token = 'test_token';
            const encrypted1 = TokenManager.encryptToken(token, encryptionKey);
            const encrypted2 = TokenManager.encryptToken(token, encryptionKey);
            expect(encrypted1).not.toBe(encrypted2);
        });
    });
}); 