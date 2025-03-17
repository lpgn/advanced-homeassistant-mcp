/**
 * MCP Server Configuration
 * 
 * This file contains the configuration for the MCP server.
 * Values can be overridden via environment variables.
 */

// Default values for the application configuration
export const APP_CONFIG = {
    // Server configuration
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Execution settings
    EXECUTION_TIMEOUT: process.env.EXECUTION_TIMEOUT ? parseInt(process.env.EXECUTION_TIMEOUT, 10) : 30000,
    STREAMING_ENABLED: process.env.STREAMING_ENABLED === 'true',

    // Transport settings
    USE_STDIO_TRANSPORT: process.env.USE_STDIO_TRANSPORT === 'true',
    USE_HTTP_TRANSPORT: process.env.USE_HTTP_TRANSPORT !== 'false',

    // Debug and logging settings
    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
    DEBUG_STDIO: process.env.DEBUG_STDIO === 'true',
    DEBUG_HTTP: process.env.DEBUG_HTTP === 'true',
    SILENT_STARTUP: process.env.SILENT_STARTUP === 'true',

    // CORS settings
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};

export default APP_CONFIG; 