/**
 * Logger Module
 * 
 * This module provides a consistent logging interface for all MCP components.
 * It handles log formatting, error handling, and ensures log output is directed
 * to the appropriate destination based on the runtime environment.
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Special handling for stdio mode to ensure stdout stays clean for JSON-RPC
const isStdioMode = process.env.USE_STDIO_TRANSPORT === 'true';
const isDebugStdio = process.env.DEBUG_STDIO === 'true';

// Create base format that works with TypeScript
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger with appropriate transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'error',
  format: baseFormat,
  defaultMeta: { service: 'mcp-server' },
  transports: [
    // Always log to files
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') })
  ]
});

// Handle console output based on environment
if (process.env.NODE_ENV !== 'production' || process.env.CONSOLE_LOGGING === 'true') {
  // In stdio mode with debug enabled, ensure logs only go to stderr to keep stdout clean for JSON-RPC
  if (isStdioMode && isDebugStdio) {
    // Use stderr stream transport in stdio debug mode
    logger.add(new winston.transports.Stream({
      stream: process.stderr,
      format: winston.format.combine(
        winston.format.simple()
      )
    }));
  } else {
    // Use console transport in normal mode
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }));
  }
}

// Custom logger interface
export interface MCPLogger {
  debug: (message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
  child: (options: Record<string, any>) => MCPLogger;
}

// Export the winston logger with MCPLogger interface
export { logger };

// Export default logger for convenience
export default logger;
