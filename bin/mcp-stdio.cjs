#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * MCP Server - Stdio Transport Mode (CommonJS)
 * 
 * This is the CommonJS entry point for running the MCP server via NPX in stdio mode.
 * It will directly load the stdio-server.js file which is optimized for the CLI usage.
 */

// Set environment variable for stdio transport
process.env.USE_STDIO_TRANSPORT = 'true';

// Load environment variables from .env file (if exists)
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    } else {
        // Load .env.example if it exists
        const examplePath = path.resolve(process.cwd(), '.env.example');
        if (fs.existsSync(examplePath)) {
            dotenv.config({ path: examplePath });
        }
    }
} catch (error) {
    // Silent error handling
}

// Ensure logs directory exists
try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
} catch (error) {
    // Silent error handling
}

// Try to load the server
try {
    // Check for simplified stdio server build first (preferred for CLI usage)
    const stdioServerPath = path.resolve(__dirname, '../dist/stdio-server.js');

    if (fs.existsSync(stdioServerPath)) {
        // If we're running in Node.js (not Bun), we need to handle ESM imports differently
        if (typeof Bun === 'undefined') {
            // Use dynamic import for ESM modules in CommonJS
            import(stdioServerPath).catch((err) => {
                console.error('Failed to import stdio server:', err.message);
                process.exit(1);
            });
        } else {
            // In Bun, we can directly require the module
            require(stdioServerPath);
        }
    } else {
        // Fall back to full server if available
        const fullServerPath = path.resolve(__dirname, '../dist/index.js');

        if (fs.existsSync(fullServerPath)) {
            console.warn('Warning: stdio-server.js not found, falling back to index.js');
            console.warn('For optimal CLI performance, build with "npm run build:stdio"');

            if (typeof Bun === 'undefined') {
                import(fullServerPath).catch((err) => {
                    console.error('Failed to import server:', err.message);
                    process.exit(1);
                });
            } else {
                require(fullServerPath);
            }
        } else {
            console.error('Error: No server implementation found. Please build the project first.');
            process.exit(1);
        }
    }
} catch (error) {
    console.error('Error starting server:', error.message);
    process.exit(1);
} 