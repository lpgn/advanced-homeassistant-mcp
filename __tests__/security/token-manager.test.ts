import { TokenManager } from '../../src/security/index.js';

describe('TokenManager', () => {
    const encryptionKey = 'test-encryption-key-32-chars-long!!';
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNjE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    describe('Token Encryption/Decryption', () => {
        it('should encrypt and decrypt tokens successfully', () => {
            const encrypted = TokenManager.encryptToken(validToken, encryptionKey);
            const decrypted = TokenManager.decryptToken(encrypted, encryptionKey);
            expect(decrypted).toBe(validToken);
        });

        it('should generate different encrypted values for same token', () => {
            const encrypted1 = TokenManager.encryptToken(validToken, encryptionKey);
            const encrypted2 = TokenManager.encryptToken(validToken, encryptionKey);
            expect(encrypted1).not.toBe(encrypted2);
        });

        it('should handle empty tokens', () => {
            expect(() => TokenManager.encryptToken('', encryptionKey)).toThrow('Invalid token');
            expect(() => TokenManager.decryptToken('', encryptionKey)).toThrow('Invalid encrypted token');
        });

        it('should handle empty encryption keys', () => {
            expect(() => TokenManager.encryptToken(validToken, '')).toThrow('Invalid encryption key');
            expect(() => TokenManager.decryptToken(validToken, '')).toThrow('Invalid encryption key');
        });

        it('should fail decryption with wrong key', () => {
            const encrypted = TokenManager.encryptToken(validToken, encryptionKey);
            expect(() => TokenManager.decryptToken(encrypted, 'wrong-key-32-chars-long!!!!!!!!')).toThrow();
        });
    });

    describe('Token Validation', () => {
        it('should validate correct tokens', () => {
            const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNjcyNTI3OTk5fQ.Q6cm_sZS6uqfGqO3LQ-0VqNXhqXR6mFh6IP7s0NPnSQ';
            expect(TokenManager.validateToken(validJwt)).toBe(true);
        });

        it('should reject expired tokens', () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            expect(TokenManager.validateToken(expiredToken)).toBe(false);
        });

        it('should reject malformed tokens', () => {
            expect(TokenManager.validateToken('invalid-token')).toBe(false);
        });

        it('should reject tokens with invalid signature', () => {
            const tamperedToken = validToken.slice(0, -5) + 'xxxxx';
            expect(TokenManager.validateToken(tamperedToken)).toBe(false);
        });

        it('should handle tokens with missing expiration', () => {
            const noExpToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.Q6cm_sZS6uqfGqO3LQ-0VqNXhqXR6mFh6IP7s0NPnSQ';
            expect(TokenManager.validateToken(noExpToken)).toBe(false);
        });
    });

    describe('Security Features', () => {
        it('should use secure encryption algorithm', () => {
            const encrypted = TokenManager.encryptToken(validToken, encryptionKey);
            expect(encrypted).toContain('aes-256-gcm');
        });

        it('should prevent token tampering', () => {
            const encrypted = TokenManager.encryptToken(validToken, encryptionKey);
            const tampered = encrypted.slice(0, -5) + 'xxxxx';
            expect(() => TokenManager.decryptToken(tampered, encryptionKey)).toThrow();
        });

        it('should use unique IVs for each encryption', () => {
            const encrypted1 = TokenManager.encryptToken(validToken, encryptionKey);
            const encrypted2 = TokenManager.encryptToken(validToken, encryptionKey);
            const iv1 = encrypted1.split(':')[1];
            const iv2 = encrypted2.split(':')[1];
            expect(iv1).not.toBe(iv2);
        });

        it('should handle large tokens', () => {
            const largeToken = 'x'.repeat(10000);
            const encrypted = TokenManager.encryptToken(largeToken, encryptionKey);
            const decrypted = TokenManager.decryptToken(encrypted, encryptionKey);
            expect(decrypted).toBe(largeToken);
        });
    });

    describe('Error Handling', () => {
        it('should throw descriptive errors for invalid inputs', () => {
            expect(() => TokenManager.encryptToken(null as any, encryptionKey)).toThrow('Invalid token');
            expect(() => TokenManager.encryptToken(validToken, null as any)).toThrow('Invalid encryption key');
            expect(() => TokenManager.decryptToken('invalid-base64', encryptionKey)).toThrow('Invalid encrypted token');
        });

        it('should handle corrupted encrypted data', () => {
            const encrypted = TokenManager.encryptToken(validToken, encryptionKey);
            const corrupted = encrypted.replace(/[a-zA-Z]/g, 'x');
            expect(() => TokenManager.decryptToken(corrupted, encryptionKey)).toThrow();
        });

        it('should handle invalid base64 input', () => {
            expect(() => TokenManager.decryptToken('not-base64!@#$%^', encryptionKey)).toThrow();
        });

        it('should handle undefined and null inputs', () => {
            expect(TokenManager.validateToken(undefined as any)).toBe(false);
            expect(TokenManager.validateToken(null as any)).toBe(false);
        });
    });
}); 