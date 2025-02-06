# System Configuration

This document provides detailed information about configuring the Home Assistant MCP Server.

## Configuration File Structure

The MCP Server uses a hierarchical configuration structure:

```yaml
server:
  host: 0.0.0.0
  port: 8123
  log_level: INFO

security:
  jwt_secret: YOUR_SECRET_KEY
  allowed_origins:
    - http://localhost:3000
    - https://your-domain.com

devices:
  scan_interval: 30
  default_timeout: 10
```

## Server Settings

### Basic Server Configuration
- `host`: Server binding address (default: 0.0.0.0)
- `port`: Server port number (default: 8123)
- `log_level`: Logging level (INFO, DEBUG, WARNING, ERROR)

### Security Settings
- `jwt_secret`: Secret key for JWT token generation
- `allowed_origins`: CORS allowed origins list
- `ssl_cert`: Path to SSL certificate (optional)
- `ssl_key`: Path to SSL private key (optional)

### Device Management
- `scan_interval`: Device state scan interval in seconds
- `default_timeout`: Default device command timeout
- `retry_attempts`: Number of retry attempts for failed commands

## Environment Variables

Environment variables override configuration file settings:

```bash
MCP_HOST=0.0.0.0
MCP_PORT=8123
MCP_LOG_LEVEL=INFO
MCP_JWT_SECRET=your-secret-key
```

## Advanced Configuration

### Rate Limiting
```yaml
rate_limit:
  enabled: true
  requests_per_minute: 100
  burst: 20
```

### Caching
```yaml
cache:
  enabled: true
  ttl: 300  # seconds
  max_size: 1000  # entries
```

### Logging
```yaml
logging:
  file: /var/log/mcp-server.log
  max_size: 10MB
  backup_count: 5
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
```

## Best Practices

1. Always use environment variables for sensitive information
2. Keep configuration files in a secure location
3. Regularly backup your configuration
4. Use SSL in production environments
5. Monitor log files for issues

## Validation

The server validates configuration on startup:
- Required fields are checked
- Value types are verified
- Ranges are validated
- Security settings are assessed

## Troubleshooting

Common configuration issues:
1. Permission denied accessing files
2. Invalid YAML syntax
3. Missing required fields
4. Type mismatches in values

See the [Troubleshooting Guide](troubleshooting.md) for solutions. 