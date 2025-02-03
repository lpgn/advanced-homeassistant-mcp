/**
 * Logging Module
 * 
 * This module provides logging functionality with rotation support.
 * It uses winston for logging and winston-daily-rotate-file for rotation.
 * 
 * @module logger
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { APP_CONFIG } from '../config/app.config.js';

/**
 * Log levels configuration
 * Defines the severity levels for logging
 */
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

/**
 * Log level colors configuration
 * Defines colors for different log levels
 */
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

/**
 * Add colors to winston
 */
winston.addColors(colors);

/**
 * Log format configuration
 * Defines how log messages are formatted
 */
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

/**
 * Transport for daily rotating file
 * Configures how logs are rotated and stored
 */
const dailyRotateFileTransport = new DailyRotateFile({
    filename: 'logs/%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
    )
});

/**
 * Transport for error logs
 * Stores error logs in a separate file
 */
const errorFileTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
    )
});

/**
 * Create the logger instance
 */
const logger = winston.createLogger({
    level: APP_CONFIG.NODE_ENV === 'development' ? 'debug' : 'info',
    levels,
    format,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        dailyRotateFileTransport,
        errorFileTransport
    ],
});

/**
 * Export the logger instance
 */
export { logger }; 