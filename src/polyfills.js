// Add necessary polyfills for Node.js compatibility in Bun
import { webcrypto } from 'node:crypto';

// Polyfill for crypto.subtle in Bun
if (!globalThis.crypto?.subtle) {
    globalThis.crypto = webcrypto;
}

// Add any other necessary polyfills here 