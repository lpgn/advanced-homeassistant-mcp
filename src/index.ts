/**
 * Home Assistant MCP (Master Control Program)
 * Main application entry point
 * 
 * This file initializes the Express server and sets up necessary
 * middleware and routes for the application when not in Claude mode.
 * 
 * @module index
 */

import express from 'express';
import { APP_CONFIG } from './config/app.config.js';
import { apiRoutes } from './routes/index.js';
import { securityHeaders, rateLimiter, validateRequest, sanitizeInput, errorHandler } from './security/index.js';
import { requestLogger, errorLogger } from './middleware/logging.middleware.js';
import { get_hass } from './hass/index.js';
import { LiteMCP } from 'litemcp';
import { logger } from './utils/logger.js';
import { initLogRotation } from './utils/log-rotation.js';

logger.info('Starting Home Assistant MCP...');
logger.info('Initializing Home Assistant connection...');

// Initialize log rotation
initLogRotation();

/**
 * Initialize LiteMCP instance
 * This provides the core MCP functionality
 */
const server = new LiteMCP('home-assistant', APP_CONFIG.VERSION);

// Only start Express server when not in Claude mode
if (process.env.PROCESSOR_TYPE !== 'claude') {
  /**
   * Initialize Express application with security middleware
   * and route handlers
   */
  const app = express();

  // Apply logging middleware first to catch all requests
  app.use(requestLogger);

  // Apply security middleware
  app.use(securityHeaders);
  app.use(rateLimiter);
  app.use(express.json());
  app.use(validateRequest);
  app.use(sanitizeInput);

  /**
   * Mount API routes under /api
   * All API endpoints are prefixed with /api
   */
  app.use('/api', apiRoutes);

  /**
   * Apply error handling middleware
   * This should be the last middleware in the chain
   */
  app.use(errorLogger);
  app.use(errorHandler);

  /**
   * Start the server and listen for incoming connections
   * The port is configured in the environment variables
   */
  app.listen(APP_CONFIG.PORT, () => {
    logger.info(`Server is running on port ${APP_CONFIG.PORT}`);
  });
} else {
  logger.info('Running in Claude mode - Express server disabled');
}