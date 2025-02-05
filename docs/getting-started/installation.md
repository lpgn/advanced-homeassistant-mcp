---
layout: default
title: Installation
parent: Getting Started
nav_order: 1
---

# Installation Guide 🛠️

This guide covers different methods to install and set up the MCP Server for Home Assistant. Choose the installation method that best suits your needs.

## Prerequisites

Before installing MCP Server, ensure you have:

- Home Assistant instance running and accessible
- Node.js 18+ or Docker installed
- Home Assistant Long-Lived Access Token ([How to get one](https://developers.home-assistant.io/docs/auth_api/#long-lived-access-token))

## Installation Methods

### 1. 🔧 Smithery Installation (Recommended)

The easiest way to install MCP Server is through Smithery:

```bash
npx -y @smithery/cli install @jango-blockchained/advanced-homeassistant-mcp --client claude
```

### 2. 🐳 Docker Installation

For a containerized deployment:

```bash
# Clone the repository
git clone --depth 1 https://github.com/jango-blockchained/advanced-homeassistant-mcp.git
cd advanced-homeassistant-mcp

# Configure environment variables
cp .env.example .env
# Edit .env with your Home Assistant details:
# - HA_URL: Your Home Assistant URL
# - HA_TOKEN: Your Long-Lived Access Token
# - Other configuration options

# Build and start containers
docker compose up -d --build

# View logs (optional)
docker compose logs -f --tail=50
```

### 3. 💻 Manual Installation

For direct installation on your system:

```bash
# Install Bun runtime
curl -fsSL https://bun.sh/install | bash

# Clone and install
git clone https://github.com/jango-blockchained/advanced-homeassistant-mcp.git
cd advanced-homeassistant-mcp
bun install --frozen-lockfile

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start the server
bun run dev --watch
```

## Configuration

### Environment Variables

Key configuration options in your `.env` file:

```env
# Home Assistant Configuration
HA_URL=http://your-homeassistant:8123
HA_TOKEN=your_long_lived_access_token

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Security Settings
JWT_SECRET=your_secure_jwt_secret
RATE_LIMIT=100
```

### Client Integration

#### Cursor Integration

Add to `.cursor/config/config.json`:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "bun",
      "args": ["run", "start"],
      "cwd": "${workspaceRoot}",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

#### Claude Desktop Integration

Add to your Claude configuration:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "bun",
      "args": ["run", "start", "--port", "8080"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Verification

To verify your installation:

1. Check server status:
   ```bash
   curl http://localhost:3000/health
   ```

2. Test Home Assistant connection:
   ```bash
   curl http://localhost:3000/api/state
   ```

## Troubleshooting

If you encounter issues:

1. Check the [Troubleshooting Guide](../troubleshooting.md)
2. Verify your environment variables
3. Check server logs:
   ```bash
   # For Docker installation
   docker compose logs -f
   
   # For manual installation
   bun run dev
   ```

## Next Steps

- Follow the [Quick Start Guide](quickstart.md) to begin using MCP Server
- Read the [API Documentation](../api/index.md) for integration details
- Check the [Architecture Overview](../architecture.md) to understand the system

## Support

Need help? Check our [Support Resources](../index.md#support) or [open an issue](https://github.com/jango-blockchained/advanced-homeassistant-mcp/issues). 