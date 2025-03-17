#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Set environment variable - enable stdio transport and silence output
process.env.USE_STDIO_TRANSPORT = 'true';
process.env.LOG_LEVEL = 'silent';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Check if .env exists, create from example if not
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
}

// Start the MCP server with redirected stderr
try {
    // Use our silent-mcp.sh script if it exists, otherwise use mcp-stdio.cjs
    const silentScriptPath = path.join(process.cwd(), 'silent-mcp.sh');

    if (fs.existsSync(silentScriptPath) && fs.statSync(silentScriptPath).isFile()) {
        // Execute the silent-mcp.sh script instead
        const childProcess = spawn('/bin/bash', [silentScriptPath], {
            stdio: ['inherit', 'inherit', 'ignore'], // Redirect stderr to /dev/null
        });

        childProcess.on('error', (err) => {
            console.error('Failed to start server:', err.message);
            process.exit(1);
        });

        // Properly handle process termination
        process.on('SIGINT', () => {
            childProcess.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
            childProcess.kill('SIGTERM');
        });
    } else {
        // Fall back to original method if silent-mcp.sh doesn't exist
        const scriptPath = path.join(__dirname, 'mcp-stdio.cjs');

        // Use 'pipe' for stdout and ignore (null) for stderr
        const childProcess = spawn('node', [scriptPath], {
            stdio: ['inherit', 'pipe', 'ignore'], // Redirect stderr to /dev/null
            env: {
                ...process.env,
                USE_STDIO_TRANSPORT: 'true',
                LOG_LEVEL: 'silent'
            }
        });

        // Pipe child's stdout to parent's stdout
        childProcess.stdout.pipe(process.stdout);

        childProcess.on('error', (err) => {
            console.error('Failed to start server:', err.message);
            process.exit(1);
        });

        // Properly handle process termination
        process.on('SIGINT', () => {
            childProcess.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
            childProcess.kill('SIGTERM');
        });
    }
} catch (error) {
    console.error('Error starting server:', error.message);
    process.exit(1);
} 