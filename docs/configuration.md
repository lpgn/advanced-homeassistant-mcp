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

This document describes all available configuration options for the Home Assistant MCP Server.

## Environment Variables

### Required Settings

```bash
# Server Configuration
PORT=3000                      # Server port
HOST=localhost                 # Server host

# Home Assistant
HASS_URL=http://localhost:8123 # Home Assistant URL
HASS_TOKEN=your_token         # Long-lived access token

# Security
JWT_SECRET=your_secret        # JWT signing secret
```

### Optional Settings

```bash
# Rate Limiting
RATE_LIMIT_WINDOW=60000       # Time window in ms (default: 60000)
RATE_LIMIT_MAX=100           # Max requests per window (default: 100)

# Logging
LOG_LEVEL=info               # debug, info, warn, error (default: info)
LOG_DIR=logs                 # Log directory (default: logs)
LOG_MAX_SIZE=10m            # Max log file size (default: 10m)
LOG_MAX_FILES=5             # Max number of log files (default: 5)

# WebSocket/SSE
WS_HEARTBEAT=30000          # WebSocket heartbeat interval in ms (default: 30000)
SSE_RETRY=3000             # SSE retry interval in ms (default: 3000)

# Speech Features
ENABLE_SPEECH_FEATURES=false # Enable speech processing (default: false)
ENABLE_WAKE_WORD=false      # Enable wake word detection (default: false)
ENABLE_SPEECH_TO_TEXT=false # Enable speech-to-text (default: false)

# Speech Model Configuration
WHISPER_MODEL_PATH=/models  # Path to whisper models (default: /models)
WHISPER_MODEL_TYPE=base     # Model type: tiny|base|small|medium|large-v2 (default: base)
WHISPER_LANGUAGE=en        # Primary language (default: en)
WHISPER_TASK=transcribe    # Task type: transcribe|translate (default: transcribe)
WHISPER_DEVICE=cuda        # Processing device: cpu|cuda (default: cuda if available, else cpu)

# Wake Word Configuration
WAKE_WORDS=hey jarvis,ok google,alexa  # Comma-separated wake words (default: hey jarvis)
WAKE_WORD_SENSITIVITY=0.5   # Detection sensitivity 0-1 (default: 0.5)
```

## Speech Features

### Model Selection

Choose a model based on your needs:

| Model      | Size  | Memory Required | Speed | Accuracy |
|------------|-------|-----------------|-------|----------|
| tiny.en    | 75MB  | 1GB            | Fast  | Basic    |
| base.en    | 150MB | 2GB            | Good  | Good     |
| small.en   | 500MB | 4GB            | Med   | Better   |
| medium.en  | 1.5GB | 8GB            | Slow  | High     |
| large-v2   | 3GB   | 16GB           | Slow  | Best     |

### GPU Acceleration

When `WHISPER_DEVICE=cuda`:
- NVIDIA GPU with CUDA support required
- Significantly faster processing
- Higher memory requirements

### Wake Word Detection

- Multiple wake words supported via comma-separated list
- Adjustable sensitivity (0-1):
  - Lower values: Fewer false positives, may miss some triggers
  - Higher values: More responsive, may have false triggers
  - Default (0.5): Balanced detection

### Best Practices

1. Model Selection:
   - Start with `base.en` model
   - Upgrade if better accuracy needed
   - Downgrade if performance issues

2. Resource Management:
   - Monitor memory usage
   - Use GPU acceleration when available
   - Consider model size vs available resources

3. Wake Word Configuration:
   - Use distinct wake words
   - Adjust sensitivity based on environment
   - Limit number of wake words for better performance 