# System Configuration

This document provides detailed information about configuring the Home Assistant MCP Server.

## Configuration File Structure

The MCP Server uses environment variables for configuration, with support for different environments (development, test, production):

```bash
# .env, .env.development, or .env.test
PORT=4000
NODE_ENV=development
HASS_HOST=http://192.168.178.63:8123
HASS_TOKEN=your_token_here
JWT_SECRET=your_secret_key
```

## Server Settings

### Basic Server Configuration
- `PORT`: Server port number (default: 4000)
- `NODE_ENV`: Environment mode (development, production, test)
- `HASS_HOST`: Home Assistant instance URL
- `HASS_TOKEN`: Home Assistant long-lived access token

### Security Settings
- `JWT_SECRET`: Secret key for JWT token generation
- `RATE_LIMIT`: Rate limiting configuration
  - `windowMs`: Time window in milliseconds (default: 15 minutes)
  - `max`: Maximum requests per window (default: 100)

### WebSocket Settings
- `SSE`: Server-Sent Events configuration
  - `MAX_CLIENTS`: Maximum concurrent clients (default: 1000)
  - `PING_INTERVAL`: Keep-alive ping interval in ms (default: 30000)

## Environment Variables

All configuration is managed through environment variables:

```bash
# Server
PORT=4000
NODE_ENV=development

# Home Assistant
HASS_HOST=http://your-hass-instance:8123
HASS_TOKEN=your_token_here

# Security
JWT_SECRET=your-secret-key

# Logging
LOG_LEVEL=info
LOG_DIR=logs
LOG_MAX_SIZE=20m
LOG_MAX_DAYS=14d
LOG_COMPRESS=true
LOG_REQUESTS=true
```

## Advanced Configuration

### Security Rate Limiting
Rate limiting is enabled by default to protect against brute force attacks:

```typescript
RATE_LIMIT: {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // limit each IP to 100 requests per window
}
```

### Logging
The server uses Bun's built-in logging capabilities with additional configuration:

```typescript
LOGGING: {
  LEVEL: "info",  // debug, info, warn, error
  DIR: "logs",
  MAX_SIZE: "20m",
  MAX_DAYS: "14d",
  COMPRESS: true,
  TIMESTAMP_FORMAT: "YYYY-MM-DD HH:mm:ss:ms",
  LOG_REQUESTS: true
}
```

For production deployments, we recommend using system tools like `logrotate` for log management.

Example logrotate configuration (`/etc/logrotate.d/mcp-server`):
```
/var/log/mcp-server.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 mcp mcp
}
```

## Best Practices

1. Always use environment variables for sensitive information
2. Keep .env files secure and never commit them to version control
3. Use different environment files for development, test, and production
4. Enable SSL/TLS in production (preferably via reverse proxy)
5. Monitor log files for issues
6. Regularly rotate logs in production

## Validation

The server validates configuration on startup using Zod schemas:
- Required fields are checked (e.g., HASS_TOKEN)
- Value types are verified
- Enums are validated (e.g., LOG_LEVEL)
- Default values are applied when not specified

## Troubleshooting

Common configuration issues:
1. Missing required environment variables
2. Invalid environment variable values
3. Permission issues with log directories
4. Rate limiting too restrictive

See the [Troubleshooting Guide](troubleshooting.md) for solutions. 