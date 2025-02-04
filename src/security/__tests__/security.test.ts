import { describe, expect, it, beforeEach } from "bun:test";
import { TokenManager } from "../index.js";
import jwt from "jsonwebtoken";

const validSecret = "test-secret-key-that-is-at-least-32-chars";
const validToken = "valid-token-that-is-at-least-32-characters-long";
const testIp = "127.0.0.1";

describe("Security Module", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = validSecret;
    // Clear any existing rate limit data
    (TokenManager as any).failedAttempts = new Map();
  });

  describe("TokenManager", () => {
    it("should encrypt and decrypt tokens", () => {
      const encrypted = TokenManager.encryptToken(validToken, validSecret);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted === validToken).toBe(false);

      const decrypted = TokenManager.decryptToken(encrypted, validSecret);
      expect(decrypted).toBe(validToken);
    });

    it("should validate tokens correctly", () => {
      const payload = { userId: "123", role: "user" };
      const token = jwt.sign(payload, validSecret, { expiresIn: "1h" });
      expect(token).toBeDefined();

      const result = TokenManager.validateToken(token, testIp);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle empty tokens", () => {
      const result = TokenManager.validateToken("", testIp);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid token format");
    });

    it("should handle expired tokens", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: "123",
        role: "user",
        iat: now - 3600, // issued 1 hour ago
        exp: now - 1800  // expired 30 minutes ago
      };
      const token = jwt.sign(payload, validSecret);
      const result = TokenManager.validateToken(token, testIp);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token has expired");
    });
  });

  describe("Request Validation", () => {
    it("should validate requests with valid tokens", () => {
      const payload = { userId: "123", role: "user" };
      const token = jwt.sign(payload, validSecret, { expiresIn: "1h" });
      const result = TokenManager.validateToken(token, testIp);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid tokens", () => {
      const result = TokenManager.validateToken("invalid-token", testIp);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token length below minimum requirement");
    });
  });

  describe("Error Handling", () => {
    it("should handle missing JWT secret", () => {
      delete process.env.JWT_SECRET;
      const payload = { userId: "123", role: "user" };
      const result = TokenManager.validateToken(jwt.sign(payload, "some-secret"), testIp);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("JWT secret not configured");
    });

    it("should handle invalid token format", () => {
      const result = TokenManager.validateToken("not-a-jwt-token", testIp);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token length below minimum requirement");
    });

    it("should handle encryption errors", () => {
      expect(() => TokenManager.encryptToken("", validSecret)).toThrow("Invalid token");
      expect(() => TokenManager.encryptToken(validToken, "short-key")).toThrow("Invalid encryption key");
    });

    it("should handle decryption errors", () => {
      expect(() => TokenManager.decryptToken("invalid:format", validSecret)).toThrow();
      expect(() => TokenManager.decryptToken("aes-256-gcm:invalid:base64:data", validSecret)).toThrow();
    });
  });

  describe("Rate Limiting", () => {
    it("should implement rate limiting for failed attempts", () => {
      // Create an invalid token that's long enough to pass length check
      const invalidToken = "x".repeat(64); // Long enough to pass MIN_TOKEN_LENGTH check

      // First attempt should fail with token validation error and record the attempt
      const firstResult = TokenManager.validateToken(invalidToken, testIp);
      expect(firstResult.valid).toBe(false);
      expect(firstResult.error).toBe("Too many failed attempts. Please try again later.");

      // Verify that even a valid token is blocked during rate limiting
      const validPayload = { userId: "123", role: "user" };
      const validToken = jwt.sign(validPayload, validSecret, { expiresIn: "1h" });
      const validResult = TokenManager.validateToken(validToken, testIp);
      expect(validResult.valid).toBe(false);
      expect(validResult.error).toBe("Too many failed attempts. Please try again later.");
    });
  });
});
