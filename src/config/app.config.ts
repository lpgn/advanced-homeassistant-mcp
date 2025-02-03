import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * Load environment variables based on NODE_ENV
 * Development: .env.development
 * Test: .env.test
 * Production: .env
 */
const envFile = process.env.NODE_ENV === 'production'
    ? '.env'
    : process.env.NODE_ENV === 'test'
        ? '.env.test'
        : '.env.development';

console.log(`Loading environment from ${envFile}`);
config({ path: resolve(process.cwd(), envFile) });

/**
 * Application configuration object
 * Contains all configuration settings for the application
 */
export const APP_CONFIG = {
    /** Server Configuration */
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    /** Home Assistant Configuration */
    HASS_HOST: process.env.HASS_HOST || 'http://192.168.178.63:8123',
    HASS_TOKEN: process.env.HASS_TOKEN,

    /** Security Configuration */
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    RATE_LIMIT: {
        /** Time window for rate limiting in milliseconds */
        windowMs: 15 * 60 * 1000, // 15 minutes
        /** Maximum number of requests per window */
        max: 100 // limit each IP to 100 requests per windowMs
    },

    /** Server-Sent Events Configuration */
    SSE: {
        /** Maximum number of concurrent SSE clients */
        MAX_CLIENTS: 1000,
        /** Ping interval in milliseconds to keep connections alive */
        PING_INTERVAL: 30000 // 30 seconds
    },

    /** Application Version */
    VERSION: '0.1.0'
} as const;

/** Type definition for the configuration object */
export type AppConfig = typeof APP_CONFIG;

/** Required environment variables that must be set */
const requiredEnvVars = ['HASS_TOKEN'] as const;

/**
 * Validate that all required environment variables are set
 * Throws an error if any required variable is missing
 */
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
} 