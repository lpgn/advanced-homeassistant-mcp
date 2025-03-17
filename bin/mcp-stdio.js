#!/usr/bin/env node

/**
 * MCP Server - Stdio Transport Mode
 * 
 * This is the entry point for running the MCP server via NPX in stdio mode.
 * It automatically configures the server to use JSON-RPC 2.0 over stdin/stdout.
 */

// Set environment variables for stdio transport
process.env.USE_STDIO_TRANSPORT = 'true';

// Import and run the MCP server from the compiled output
try {
    // First make sure required directories exist
    const fs = require('fs');
    const path = require('path');

    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
        console.error('Creating logs directory...');
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Get the entry module path
    const entryPath = require.resolve('../dist/index.js');

    // Print initial message to stderr
    console.error('Starting MCP server in stdio transport mode...');
    console.error('Logs will be written to the logs/ directory');
    console.error('Communication will use JSON-RPC 2.0 format via stdin/stdout');

    // Run the server
    require(entryPath);
} catch (error) {
    console.error('Failed to start MCP server:', error.message);
    console.error('If this is your first run, you may need to build the project first:');
    console.error('  npm run build');
    process.exit(1);
} 