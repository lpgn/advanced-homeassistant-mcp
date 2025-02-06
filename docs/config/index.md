# Configuration

This section covers the configuration options available in the Home Assistant MCP Server.

## Overview

The MCP Server can be configured through various configuration files and environment variables. This section will guide you through the available options and their usage.

## Configuration Files

The main configuration files are:

1. `.env` - Environment variables
2. `config.yaml` - Main configuration file
3. `devices.yaml` - Device-specific configurations

## Environment Variables

Key environment variables that can be set:

- `MCP_HOST` - Host address (default: 0.0.0.0)
- `MCP_PORT` - Port number (default: 8123)
- `MCP_LOG_LEVEL` - Logging level (default: INFO)
- `MCP_CONFIG_DIR` - Configuration directory path

## Next Steps

- See [System Configuration](../configuration.md) for detailed configuration options
- Check [Environment Setup](../getting-started/configuration.md) for initial setup
- Review [Security](../security.md) for security-related configurations 