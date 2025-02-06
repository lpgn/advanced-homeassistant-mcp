# System Configuration

This document provides detailed information about configuring the Home Assistant MCP Server.

## Environment File Structure

The MCP Server uses a flexible environment configuration system with support for different environments and local overrides:

### Environment Files

1. `.env.example` - Template file containing all available configuration options with example values
   - Use this as a reference to create your environment-specific configuration files
   - Not loaded by the application

2. Environment-specific files (loaded based on NODE_ENV):
   - `.env.dev` - Development environment (default)
   - `.env.test` - Test environment
   - `.env.prod` - Production environment

3. `.env` - Optional local override file
   - If present, values in this file override those from the environment-specific file
   - Useful for local development without modifying the environment-specific files

### File Loading Order

1. First, the environment-specific file is loaded based on NODE_ENV:
   - `NODE_ENV=production` → `.env.prod`
   - `NODE_ENV=development` → `.env.dev` (default)
   - `NODE_ENV=test` → `.env.test`

2. Then, if a `.env` file exists, its values override any previously loaded values

Example setup:
```bash
# .env.dev - Development configuration
PORT=4000
HASS_HOST=http://homeassistant.local:8123
LOG_LEVEL=debug

# .env - Local overrides
PORT=3000  # Overrides PORT from .env.dev
HASS_HOST=http://localhost:8123  # Overrides HASS_HOST from .env.dev
```

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

### Speech Features (Optional)
- `ENABLE_SPEECH_FEATURES`: Enable speech processing features (default: false)
- `ENABLE_WAKE_WORD`: Enable wake word detection (default: false)
- `ENABLE_SPEECH_TO_TEXT`: Enable speech-to-text conversion (default: false)
- `WHISPER_MODEL_PATH`: Path to Whisper models directory (default: /models)
- `WHISPER_MODEL_TYPE`: Whisper model type (default: base)
  - Available models: tiny.en, base.en, small.en, medium.en, large-v2

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

# Speech Features (Optional)
ENABLE_SPEECH_FEATURES=false
ENABLE_WAKE_WORD=false
ENABLE_SPEECH_TO_TEXT=false
WHISPER_MODEL_PATH=/models
WHISPER_MODEL_TYPE=base
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

### Speech-to-Text Configuration
When speech features are enabled, you can configure the following options:

```typescript
SPEECH: {
  ENABLED: false,  // Master switch for all speech features
  WAKE_WORD_ENABLED: false,  // Enable wake word detection
  SPEECH_TO_TEXT_ENABLED: false,  // Enable speech-to-text
  WHISPER_MODEL_PATH: "/models",  // Path to Whisper models
  WHISPER_MODEL_TYPE: "base",  // Model type to use
}
```

Available Whisper models:
- `tiny.en`: Fastest, lowest accuracy
- `base.en`: Good balance of speed and accuracy
- `small.en`: Better accuracy, slower
- `medium.en`: High accuracy, much slower
- `large-v2`: Best accuracy, very slow

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
7. Start with smaller Whisper models and upgrade if needed
8. Consider GPU acceleration for larger Whisper models

## Validation

The server validates configuration on startup using Zod schemas:
- Required fields are checked (e.g., HASS_TOKEN)
- Value types are verified
- Enums are validated (e.g., LOG_LEVEL, WHISPER_MODEL_TYPE)
- Default values are applied when not specified

## Troubleshooting

Common configuration issues:
1. Missing required environment variables
2. Invalid environment variable values
3. Permission issues with log directories
4. Rate limiting too restrictive
5. Speech model loading failures
6. Docker not available for speech features
7. Insufficient system resources for larger models

See the [Troubleshooting Guide](troubleshooting.md) for solutions.

# Configuration Guide

This document describes the environment configuration system for the Home Assistant MCP Server.

## Environment Setup

### Using the Setup Script

The MCP Server provides a setup script to help manage your environment configuration:

```bash
# Make the script executable
chmod +x scripts/setup-env.sh

# Basic usage (uses NODE_ENV or defaults to development)
./scripts/setup-env.sh

# Specify an environment
NODE_ENV=production ./scripts/setup-env.sh

# Force override existing files
./scripts/setup-env.sh --force
```

The setup script will:
1. Check for `.env.example` and create `.env` if it doesn't exist
2. Detect the environment (development/production/test)
3. Optionally override `.env` with environment-specific settings
4. Maintain your existing configuration unless forced to override

### Manual Setup

If you prefer to set up manually:

```bash
# Copy the example configuration
cp .env.example .env

# Then copy the appropriate environment override
cp .env.dev .env     # For development
cp .env.prod .env    # For production
cp .env.test .env    # For testing
```

## Environment File Hierarchy

### Base Configuration Files
- `.env.example` - Template with all available options and documentation
- `.env` - Your main configuration file (copied from .env.example)

### Environment-Specific Files
- `.env.dev` - Development environment settings
- `.env.prod` - Production environment settings
- `.env.test` - Test environment settings

### Loading Order and Priority

Files are loaded in the following sequence, with later files overriding earlier ones:

1. `.env` (base configuration)
2. Environment-specific file based on NODE_ENV:
   - `NODE_ENV=development` → `.env.dev`
   - `NODE_ENV=production` → `.env.prod`
   - `NODE_ENV=test` → `.env.test`

### Docker Environment Handling

When using Docker, the environment is loaded as follows:

1. `.env` file (base configuration)
2. `.env.${NODE_ENV}` file (environment-specific overrides)
3. Environment variables from docker-compose.yml
4. Command-line environment variables

Example docker-compose.yml configuration:
```yaml
services:
  homeassistant-mcp:
    env_file:
      - .env
      - .env.${NODE_ENV:-development}
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - PORT=4000
      - HASS_HOST
      - HASS_TOKEN
      - LOG_LEVEL=${LOG_LEVEL:-info}
```

Override examples:
```bash
# Override NODE_ENV
NODE_ENV=production docker compose up -d

# Override multiple variables
NODE_ENV=production LOG_LEVEL=debug docker compose up -d
```

## Configuration Options

### Required Settings

```bash
# Server Configuration
PORT=4000                     # Server port number
NODE_ENV=development         # Environment (development/production/test)

# Home Assistant
HASS_HOST=http://homeassistant.local:8123  # Home Assistant URL
HASS_TOKEN=your_token_here                # Long-lived access token

# Security
JWT_SECRET=your_secret_key   # JWT signing secret
```

### Optional Settings

#### Security
```bash
# Rate Limiting
RATE_LIMIT_WINDOW=900000     # Time window in ms (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
RATE_LIMIT_REGULAR=100       # Regular endpoint rate limit
RATE_LIMIT_WEBSOCKET=1000    # WebSocket connection rate limit

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:8123
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
CORS_EXPOSED_HEADERS=
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400

# Cookie Security
COOKIE_SECRET=your_cookie_secret_key_min_32_chars
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=Strict
```

#### Logging
```bash
# Logging Configuration
LOG_LEVEL=info              # debug, info, warn, error
LOG_DIR=logs               # Log directory
LOG_MAX_SIZE=20m          # Max log file size
LOG_MAX_DAYS=14d         # Log retention period
LOG_COMPRESS=true        # Enable log compression
LOG_REQUESTS=true       # Log HTTP requests
```

#### Speech Features
```bash
# Speech Processing
ENABLE_SPEECH_FEATURES=false    # Master switch for speech features
ENABLE_WAKE_WORD=false         # Enable wake word detection
ENABLE_SPEECH_TO_TEXT=false    # Enable speech-to-text
WHISPER_MODEL_PATH=/models     # Path to Whisper models
WHISPER_MODEL_TYPE=base        # Whisper model type

# Audio Configuration
NOISE_THRESHOLD=0.05
MIN_SPEECH_DURATION=1.0
SILENCE_DURATION=0.5
SAMPLE_RATE=16000
CHANNELS=1
CHUNK_SIZE=1024
PULSE_SERVER=unix:/run/user/1000/pulse/native
```

## Best Practices

1. **Version Control**
   - Never commit `.env` files to version control
   - Always commit `.env.example` with documentation
   - Consider committing `.env.dev` and `.env.test` for team development

2. **Security**
   - Use strong, unique values for secrets
   - Enable HTTPS in production
   - Keep tokens and secrets in `.env` only

3. **Development**
   - Use `.env.dev` for shared development settings
   - Keep `.env` for personal overrides
   - Enable debug logging in development

4. **Production**
   - Use `.env.prod` for production defaults
   - Set appropriate rate limits
   - Configure proper logging
   - Enable all security features

5. **Testing**
   - Use `.env.test` for test configuration
   - Use mock tokens and endpoints
   - Enable detailed logging for debugging

## Troubleshooting

### Common Issues

1. **Missing Required Variables**
   - Error: "Missing required environment variable: HASS_TOKEN"
   - Solution: Ensure HASS_TOKEN is set in your .env file

2. **Permission Issues**
   - Error: "EACCES: permission denied, access '/app/logs'"
   - Solution: Ensure proper permissions on the logs directory

3. **Invalid Configuration**
   - Error: "Invalid configuration value for PORT"
   - Solution: Check the value format in your .env file

4. **Environment Override Issues**
   - Problem: Environment-specific settings not applying
   - Solution: Check NODE_ENV value and file naming

See [Troubleshooting Guide](troubleshooting.md) for more solutions. 