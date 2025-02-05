# MCP Server for Home Assistant 🏠🤖

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.26-black)](https://bun.sh) [![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org) [![smithery badge](https://smithery.ai/badge/@jango-blockchained/advanced-homeassistant-mcp)](https://smithery.ai/server/@jango-blockchained/advanced-homeassistant-mcp)

## Overview 🌐

MCP (Model Context Protocol) Server is a lightweight integration tool for Home Assistant, providing a flexible interface for device management and automation.

## Core Features ✨

- 🔌 Basic device control via REST API
- 📡 WebSocket/Server-Sent Events (SSE) for state updates
- 🤖 Simple automation rule management
- 🔐 JWT-based authentication

## Prerequisites 📋

- 🚀 Bun runtime (v1.0.26+)
- 🏡 Home Assistant instance
- 🐳 Docker (optional, recommended for deployment)

## Installation 🛠️

### Docker Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp

# Copy and edit environment configuration
cp .env.example .env
# Edit .env with your Home Assistant credentials

# Build and start containers
docker compose up -d --build
```

### Bare Metal Installation

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone the repository
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp

# Install dependencies
bun install

# Start the server
bun run dev
```

## Basic Usage 🖥️

### Device Control Example

```typescript
// Turn on a light
const response = await fetch('http://localhost:3000/api/devices/light.living_room', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ state: 'on' })
});
```

### WebSocket State Updates

```typescript
const ws = new WebSocket('ws://localhost:3000/devices');
ws.onmessage = (event) => {
  const deviceState = JSON.parse(event.data);
  console.log('Device state updated:', deviceState);
};
```

## Current Limitations ⚠️

- 🎙️ Basic voice command support (work in progress)
- 🧠 Limited advanced NLP capabilities
- 🔗 Minimal third-party device integration
- 🐛 Early-stage error handling

## Contributing 🤝

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Make your changes
4. Run tests:
   ```bash
   bun test
   ```
5. Submit a pull request

## Roadmap 🗺️

- 🎤 Enhance voice command processing
- 🔌 Improve device compatibility
- 🤖 Expand automation capabilities
- 🛡️ Implement more robust error handling

## License 📄

MIT License. See [LICENSE](LICENSE) for details.

## Support 🆘

- 🐞 [GitHub Issues](https://github.com/jango-blockchained/homeassistant-mcp/issues)
- 📖 Documentation: [Project Docs](https://jango-blockchained.github.io/homeassistant-mcp/)

## MCP Client Integration 🔗

This MCP server can be integrated with various clients that support the Model Context Protocol. Below are instructions for different client integrations:

### Cursor Integration 🖱️

The server can be integrated with Cursor by adding the configuration to `.cursor/config/config.json`:

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

### Claude Desktop Integration 💬

For Claude Desktop, add the following to your Claude configuration file:

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

### Cline Integration 📟

For Cline-based clients, add the following configuration:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "bun",
      "args": [
        "run",
        "start",
        "--enable-cline",
        "--config",
        "${configDir}/.env"
      ],
      "env": {
        "NODE_ENV": "production",
        "CLINE_MODE": "true"
      }
    }
  }
}
```

### Command Line Usage 💻

#### Windows
A CMD script is provided in the `scripts` directory. To use it:

1. Navigate to the `scripts` directory
2. Run `start_mcp.cmd`

The script will start the MCP server with default configuration.
