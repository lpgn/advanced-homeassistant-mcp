# 🏠 Home Assistant MCP

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.26-black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org)
[![smithery badge](https://smithery.ai/badge/@jango-blockchained/homeassitant-mcp)](https://smithery.ai/server/@jango-blockchained/homeassitant-mcp)

> **Bridge the gap between AI assistants and your smart home** 🚀

A powerful, secure, and extensible Model Context Protocol (MCP) server that enables AI assistants like Claude, GPT, and Cursor to seamlessly interact with Home Assistant. Control your lights, climate, automations, and more through natural language commands.

---

## ✨ Feature Overview

### 🤖 AI-Powered Smart Home Control

- **Natural Language Processing**: Turn "dim the living room lights to 50%" into actual device commands
- **Multi-Assistant Support**: Works with Claude, GPT-4, Cursor, and other MCP-compatible assistants
- **Intelligent Context**: Remembers device states, relationships, and user preferences

### 🛡️ Enterprise-Grade Security

- **No Phone Home**: Zero telemetry, analytics, or external data collection
- **Privacy First**: All network calls limited to your Home Assistant instance
- **Rate Limiting**: Protects against abuse with configurable request limits
- **Input Sanitization**: Prevents XSS and injection attacks
- **JWT Authentication**: Secure token-based access control
- **Security Headers**: Comprehensive protection against web vulnerabilities
- **Automated Scanning**: CodeQL and dependency vulnerability checks
- **Full Audit**: Complete security audit available in [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)

### ⚡ High-Performance Architecture

- **Bun Runtime**: 4x faster than Node.js with built-in TypeScript support
- **Streaming Responses**: Real-time updates for long-running operations
- **Modular Design**: Clean separation of concerns with extensible plugin system
- **Multiple Transports**: HTTP REST API, WebSocket, and Standard I/O support

### 🏠 Comprehensive Device Control

- **Lighting Control**: Brightness, color temperature, RGB colors, and effects
- **Climate Management**: Thermostats, HVAC modes, fan control, and scheduling
- **Automation & Scenes**: Trigger automations, activate scenes, and manage routines
- **Device Discovery**: Intelligent device listing with filtering and search
- **Notification System**: Send alerts through Home Assistant's notification channels

### 🎙️ Voice & AI Integration

- **Speech-to-Text**: Whisper model integration for voice commands
- **Wake Word Detection**: Always-listening capabilities with custom wake words
- **NLP Processing**: Advanced intent recognition and entity extraction
- **Context Awareness**: Learns from usage patterns and user behavior

---

## 🚀 Quick Start

Get up and running in minutes:

```bash
# Clone and install
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp
bun install

# Configure environment
cp .env.example .env
# Edit .env with your Home Assistant details

# Start the server
bun run start:stdio
```

That's it! Your AI assistant can now control your smart home. 🤖✨

---

## 📦 Installation

### Prerequisites

- 🚀 [Bun](https://bun.sh) (v1.0.26+) - *Recommended*
- 🏠 [Home Assistant](https://www.home-assistant.io/) instance
- 🐳 Docker (optional, for speech features)

### Option 1: NPX (Easiest)

```bash
npx @jango-blockchained/homeassistant-mcp@latest
```

### Option 2: Bunx with GitHub (No NPM Login Required)

If you can't login to npm, use Bunx to run directly from GitHub:

```bash
# Install Bun first if you don't have it
curl -fsSL https://bun.sh/install | bash

# Then run from GitHub
bunx github:jango-blockchained/homeassistant-mcp
```

Alternatively, install directly from Git:

```bash
bun add git+https://github.com/jango-blockchained/homeassistant-mcp.git
homeassistant-mcp
```

### Option 3: Local Installation

```bash
# Install globally
bun add -g @jango-blockchained/homeassistant-mcp

# Or locally
bun add homeassistant-mcp

# Run
homeassistant-mcp
```

### Option 4: From Source (Most Flexible)

```bash
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp
bun install
bun run build
bun run start:stdio
```

---

## 🛠️ Usage

### AI Assistant Integration

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "npx",
      "args": ["@jango-blockchained/homeassistant-mcp@latest"]
    }
  }
}
```

Or if you can't login to npm, use bunx:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "bunx",
      "args": ["github:jango-blockchained/homeassistant-mcp"]
    }
  }
}
```

#### VS Code + Claude Extension

The `.vscode/settings.json` is pre-configured for immediate use.

#### Cursor

Add to `.cursor/config/config.json`:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "npx",
      "args": ["@jango-blockchained/homeassistant-mcp@latest"]
    }
  }
}
```

Or with bunx:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "bunx",
      "args": ["github:jango-blockchained/homeassistant-mcp"]
    }
  }
}
```

### API Usage

Start the HTTP server:

```bash
bun run start -- --http
```

Available endpoints:

- `POST /api/tools/call` - Execute tools
- `GET /api/resources/list` - List resources
- `GET /api/health` - Health check
- `WebSocket /api/ws` - Real-time updates

### Configuration

Create a `.env` file:

```env
# Home Assistant
HASS_HOST=http://your-ha-instance:8123
HASS_TOKEN=your_long_lived_access_token

# Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=50
```

---

## 🏗️ Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Assistant  │◄──►│   MCP Server    │◄──►│ Home Assistant  │
│  (Claude/GPT)   │    │                 │    │                 │
└─────────────────┘    │ ┌─────────────┐ │    └─────────────────┘
                       │ │  Transport  │ │
                       │ │   Layer     │ │
                       │ └─────────────┘ │
                       │ ┌─────────────┐ │
                       │ │ Middleware  │ │
                       │ │   Layer     │ │
                       │ └─────────────┘ │
                       │ ┌─────────────┐ │
                       │ │   Tools     │ │
                       │ │   Layer     │ │
                       └─────────────────┘
```

### Core Components

- **Transport Layer**: HTTP, WebSocket, Stdio
- **Middleware Layer**: Security, validation, logging
- **Tools Layer**: Device control, automation, notifications
- **Resource Manager**: State management and caching

### Built-in Tools (27 Total)

#### Core Control Tools
- 🔦 **Lights Control**: Full spectrum lighting management with RGB and brightness
- 🌡️ **Climate Control**: HVAC and thermostat operations with multi-zone support
- ⚙️ **Automation**: Scene and automation triggers with configuration management
- 📱 **Notifications**: Multi-channel alert system
- 🎛️ **Device Control**: Universal device control (switches, covers, fans, etc.)

#### Discovery & Context Tools ⭐ NEW
- 🔍 **Entity Search**: Natural language entity search with fuzzy matching
- 📊 **Live Context**: Real-time state information for all entities in YAML format
- 📝 **System Prompts**: Context-aware prompts with entity inventory and usage guidance

#### Advanced Features
- 📋 **Device Management**: List and filter devices by domain, area, or floor
- 📜 **History**: Query historical state data and trends
- 🔔 **Event Subscriptions**: Real-time SSE event streaming
- 🛠️ **Service Calls**: Execute any Home Assistant service
- 🔧 **System Management**: Restart, reload configurations, and updates

---

## 🎯 Example Commands

Once integrated, your AI assistant can understand commands like:

### Basic Device Control
> "Turn off all lights in the bedroom"
> "Set the thermostat to 72°F"
> "Activate the movie scene"

### Smart Queries with New Tools ⭐
> "Find all my kitchen lights" *(uses entity search)*
> "What lights are currently on?" *(uses live context)*
> "Is the front door locked?" *(uses live context for real-time state)*
> "Show me all temperature sensors" *(uses entity search with domain filter)*

### Context-Aware Actions
> "If the garage door is open, close it" *(checks state, then acts)*
> "Turn off lights in empty rooms" *(analyzes presence sensors)*

### Information Queries
> "What's the current temperature in the living room?"
> "When was the front door last opened?" *(uses history)*
> "Notify everyone that dinner is ready"

---

## 🔒 Security & Privacy

### No Data Collection

This MCP server **does NOT**:
- ❌ Send telemetry or analytics
- ❌ "Phone home" to external services
- ❌ Collect usage statistics
- ❌ Transmit your data anywhere

### What It Does

✅ Communicates **only** with:
1. Your AI assistant (Claude, GPT, Cursor, etc.)
2. Your Home Assistant instance (configured via `HASS_HOST`)

### Security Auditing

```bash
# Run security audit
npm run security:scan

# Check for vulnerabilities
npm run security:audit

# Verify network calls
npm run security:check-network
```

For detailed security information, see:
- [SECURITY.md](./SECURITY.md) - Security policy and reporting
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Complete security audit

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch
3. 💻 Make your changes
4. 🧪 Add tests if applicable
5. 📝 Update documentation
6. 🔄 Submit a pull request

### Development Setup

```bash
bun install
bun run build
bun test
```

### Code Style

- TypeScript with strict mode
- ESLint for code quality
- Prettier for formatting
- Husky for pre-commit hooks

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ using:

- [Bun](https://bun.sh) - The fast JavaScript runtime
- [Home Assistant](https://www.home-assistant.io/) - The open-source home automation platform
- [Model Context Protocol](https://modelcontextprotocol.io/) - The AI integration standard

---

Transform your smart home into an AI-powered experience
