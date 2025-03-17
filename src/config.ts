/**
 * Configuration for the Model Context Protocol (MCP) server
 * Values can be overridden using environment variables
 */

export interface MCPServerConfig {
    // Server configuration
    port: number;
    environment: string;

    // Execution settings
    executionTimeout: number;
    streamingEnabled: boolean;

    // Transport settings
    useStdioTransport: boolean;
    useHttpTransport: boolean;

    // Debug and logging
    debugMode: boolean;
    debugStdio: boolean;
    debugHttp: boolean;
    silentStartup: boolean;

    // CORS settings
    corsOrigin: string;
}

export const APP_CONFIG: MCPServerConfig = {
    // Server configuration
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',

    // Execution settings
    executionTimeout: parseInt(process.env.EXECUTION_TIMEOUT || '30000', 10),
    streamingEnabled: process.env.STREAMING_ENABLED === 'true',

    // Transport settings
    useStdioTransport: process.env.USE_STDIO_TRANSPORT === 'true',
    useHttpTransport: process.env.USE_HTTP_TRANSPORT === 'true',

    // Debug and logging
    debugMode: process.env.DEBUG_MODE === 'true',
    debugStdio: process.env.DEBUG_STDIO === 'true',
    debugHttp: process.env.DEBUG_HTTP === 'true',
    silentStartup: process.env.SILENT_STARTUP === 'true',

    // CORS settings
    corsOrigin: process.env.CORS_ORIGIN || '*',
};

export default APP_CONFIG; 