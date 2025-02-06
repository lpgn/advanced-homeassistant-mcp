# MCP Server for Home Assistant 🏠🤖

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.26-black)](https://bun.sh) [![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org) [![smithery badge](https://smithery.ai/badge/@jango-blockchained/advanced-homeassistant-mcp)](https://smithery.ai/server/@jango-blockchained/advanced-homeassistant-mcp)

## Overview 🌐

MCP (Model Context Protocol) Server is a lightweight integration tool for Home Assistant, providing a flexible interface for device management and automation.

## Core Features ✨

- 🔌 Basic device control via REST API
- 📡 WebSocket/Server-Sent Events (SSE) for state updates
- 🤖 Simple automation rule management
- 🔐 JWT-based authentication
- 🎤 Real-time device control and monitoring
- 🎤 Server-Sent Events (SSE) for live updates
- 🎤 Comprehensive logging
- 🎤 Optional speech features:
  - 🎤 Wake word detection ("hey jarvis", "ok google", "alexa")
  - 🎤 Speech-to-text using fast-whisper
  - 🎤 Multiple language support
  - 🎤 GPU acceleration support

## Prerequisites 📋

- 🚀 Bun runtime (v1.0.26+)
- 🏡 Home Assistant instance
- 🐳 Docker (optional, recommended for deployment and speech features)
- 🖥️ Node.js 18+ (optional, for speech features)
- 🖥️ NVIDIA GPU with CUDA support (optional, for faster speech processing)

## Installation 🛠️

### Docker Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp

# Copy environment template:
cp .env.example .env
# Edit .env with your Home Assistant credentials and speech features settings

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

## Speech Features (Optional)

The MCP Server includes optional speech processing capabilities:

### Prerequisites
1. Docker installed and running
2. NVIDIA GPU with CUDA support (optional)
3. At least 4GB RAM (8GB+ recommended for larger models)

### Setup

1. Enable speech features in your .env:
```bash
ENABLE_SPEECH_FEATURES=true
ENABLE_WAKE_WORD=true
ENABLE_SPEECH_TO_TEXT=true
WHISPER_MODEL_PATH=/models
WHISPER_MODEL_TYPE=base
```

2. Start the speech services:
```bash
docker-compose up -d
```

### Available Models

Choose a model based on your needs:
- `tiny.en`: Fastest, basic accuracy
- `base.en`: Good balance (recommended)
- `small.en`: Better accuracy, slower
- `medium.en`: High accuracy, resource intensive
- `large-v2`: Best accuracy, very resource intensive

### Usage

1. Wake word detection listens for:
   - "hey jarvis"
   - "ok google"
   - "alexa"

2. After wake word detection:
   - Audio is automatically captured
   - Speech is transcribed
   - Commands are processed

3. Manual transcription is also available:
```typescript
const speech = speechService.getSpeechToText();
const text = await speech.transcribe(audioBuffer);
```

## Configuration

See [Configuration Guide](docs/configuration.md) for detailed settings.

## API Documentation

See [API Documentation](docs/api/index.md) for available endpoints.

## Development

See [Development Guide](docs/development/index.md) for contribution guidelines.

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
