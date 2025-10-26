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

### 🎨 Advanced Dashboard Generator

- **Device-Optimized Layouts**: Generate dashboards for mobile, desktop, tablet, and wall panels
- **Smart Prioritization**: Organize by most-used, by-area, by-type, or custom priority
- **Usage Analysis**: Track and analyze entity usage patterns for data-driven layouts
- **Auto-Optimization**: Convert existing dashboards for different devices
- **20+ Card Types**: Support for all Lovelace card types with intelligent selection
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

### Option 5: Local Docker Setup (Recommended for Development)

For local development with the full feature set:

```bash
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp

# Create .env file with your Home Assistant credentials
cp .env.example .env
# Edit .env with your HASS_URL and HASS_TOKEN

# Start the container
docker-compose up -d

# Verify it's running
docker-compose ps
```

Then add to your MCP client configuration (see [LOCAL_MCP_SETUP.md](./LOCAL_MCP_SETUP.md) for details):

```json
{
  "mcpServers": {
    "homeassistant-local": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "homeassistant-mcp-server",
        "bun",
        "run",
        "src/stdio-server.ts"
      ]
    }
  }
}
```

**See [LOCAL_MCP_SETUP.md](./LOCAL_MCP_SETUP.md) for complete setup instructions and troubleshooting.**

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

### Built-in Tools (29 Total)

#### Device Control Tools (6)
- 🔦 **lights_control**: Full spectrum lighting management with RGB, brightness, and color temperature
- 🌡️ **climate_control**: HVAC and thermostat operations with multi-zone support
- ⚙️ **automation**: Scene and automation triggers with configuration management
- 📱 **notify**: Multi-channel alert and notification system
- 🎛️ **control**: Universal device control (switches, covers, fans, locks, media players)
- 📋 **list_devices**: List and filter devices by domain, area, or floor

#### Discovery & Context Tools (4) ⭐
- 🔍 **entity_search**: Natural language entity search with fuzzy matching and domain filtering
- 📊 **get_live_context**: Real-time state information for all entities with optional domain filtering
- 📝 **get_system_prompt**: Context-aware system prompts with entity inventory and usage guidance
- 🧾 **get_entity**: Targeted entity lookups with field filtering for token-efficient responses

#### System Insight & Diagnostics (3) ⭐
- 🆔 **get_version**: Retrieve Home Assistant version, timezone, unit system, and installation details
- 🗂️ **system_overview**: Complete inventory of entities, domains, services, and loaded components
- 📊 **domain_summary**: Domain-level statistics with state distribution, common attributes, and examples

#### Dashboard & Configuration Tools (3) ⭐
- 🎨 **dashboard_config**: Generate device-optimized Lovelace dashboards (mobile/desktop/tablet/wall-panel)
  - Smart prioritization (most-used, by-area, by-type, custom)
  - Usage pattern analysis
  - Auto-optimization for different devices
  - 20+ card types with intelligent selection
- 🧰 **yaml_editor**: Discover configuration files and validate YAML operations safely
- ⚙️ **automation_config**: Advanced automation creation, updating, and configuration management

#### System Management Tools (6)
- 🔧 **system_management**: Reload configurations, manage updates, restart services
- 🔁 **restart_ha**: Safe restart with explicit confirmation workflow
- 🛠️ **call_service**: Execute any Home Assistant service with parameters
- 📂 **file_operations**: Read, write, delete, and list configuration files
- 💻 **shell_command**: Execute shell commands in Home Assistant environment
- � **addon**: Manage Home Assistant add-ons (list, install, uninstall, start, stop)

#### Data & Events Tools (4)
- 📜 **history**: Query historical state data and trends with time-based filtering
- � **subscribe_events**: Real-time SSE event streaming for state changes
- � **get_sse_stats**: Get SSE connection statistics and monitoring data
- 📋 **error_log**: Retrieve and filter Home Assistant error logs

#### Package Management (1)
- � **package**: Manage HACS packages (list, install, uninstall, update)

#### Utility Tools (2)
- ℹ️ **system_info**: Get MCP server information and status
- 🏠 **scene**: Manage and activate Home Assistant scenes

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

### Dashboard Generation ⭐
> "Generate a mobile dashboard with my most used entities"
> "Create a wall panel layout for the entryway"
> "Optimize my desktop dashboard for a tablet"
> "Analyze my usage patterns over the last 2 weeks"

---

## 📖 Complete Tools Reference

### 🔦 lights_control
Control lights with advanced features including RGB, brightness, color temperature, and effects.

**Operations:** turn_on, turn_off, toggle, set_brightness, set_color, set_temperature

### 🌡️ climate_control
Manage climate devices and thermostats with HVAC modes, temperature settings, and fan control.

**Operations:** set_temperature, set_hvac_mode, set_fan_mode, set_humidity

### 🎛️ control
Universal device control for switches, covers, fans, locks, and media players.

**Operations:** turn_on, turn_off, toggle, open, close, stop, set_position

### ⚙️ automation
Manage automations and scenes with trigger, enable/disable, and configuration.

**Operations:** trigger, list, toggle, get_config

### 📱 notify
Send notifications through Home Assistant's notification services.

**Operations:** send (with title, message, target)

### 📋 list_devices
List and filter devices by domain, area, or floor with detailed information.

**Parameters:** domain, area, floor

### 🔍 entity_search
Search for entities using natural language queries with fuzzy matching.

**Parameters:** query, domain (optional), limit (default: 10)

### 📊 get_live_context
Get real-time state information for all or filtered entities.

**Parameters:** domain (optional for filtering)

### 📝 get_system_prompt
Generate context-aware system prompts with entity inventory.

**Parameters:** domain_filter, include_entities, include_areas

### 🧾 get_entity
Get detailed information about specific entities with field filtering.

**Parameters:** entity_id, fields (optional)

### 🆔 get_version
Retrieve Home Assistant version, timezone, unit system, and installation details.

**Returns:** version, timezone, unit_system, location, installation_type

### 🗂️ system_overview
Get complete system inventory including entities, domains, and services.

**Returns:** total_entities, domains_summary, areas, services_count, integrations

### 📊 domain_summary
Get domain-level statistics with state distribution and examples.

**Parameters:** domain, example_limit (default: 3)

### 🎨 dashboard_config
Generate device-optimized Lovelace dashboards with smart layouts.

**Operations:**
- `generate_smart_layout`: Create complete device-optimized dashboard
- `analyze_usage_patterns`: Track entity usage statistics
- `optimize_for_device`: Convert layouts for different devices
- `list_card_types`: Show all available card types
- `create_view`: Create single dashboard view
- `create_card`: Create individual card configuration
- `get_recommendations`: Get AI optimization suggestions

**Parameters:** operation, config (device_type, priority, areas)

**See:** [DASHBOARD_GENERATOR_GUIDE.md](./DASHBOARD_GENERATOR_GUIDE.md)

### 🧰 yaml_editor
Discover and validate YAML configuration files safely.

**Operations:** discover, validate, read, write

### ⚙️ automation_config
Advanced automation configuration and management.

**Operations:** create, update, delete, duplicate

### 🔧 system_management
System-level operations for configuration and updates.

**Operations:** restart, reload_core_config, reload_automation, reload_script, check_config

### 🔁 restart_ha
Safe Home Assistant restart with explicit confirmation.

**Parameters:** confirm (must be true)

### 🛠️ call_service
Execute any Home Assistant service with parameters.

**Parameters:** domain, service, entity_id, service_data

### 📂 file_operations
Manage configuration files (read, write, delete, list).

**Operations:** read, write, delete, list, exists

**Parameters:** operation, path, content, encoding

### 💻 shell_command
Execute shell commands in Home Assistant environment.

**Parameters:** command, timeout

### 🔌 addon
Manage Home Assistant add-ons.

**Operations:** list, info, install, uninstall, start, stop, restart

### 📜 history
Query historical state data with time-based filtering.

**Parameters:** entity_ids, start_time, end_time, minimal_response

### 🔔 subscribe_events
Real-time SSE event streaming for state changes.

**Parameters:** token, entity_id, domain, events

### 📊 get_sse_stats
Get SSE connection statistics and monitoring data.

**Parameters:** token

### 📋 error_log
Retrieve and filter Home Assistant error logs.

**Parameters:** lines (default: 50), filter

### 📦 package
Manage HACS packages and custom components.

**Operations:** list, install, uninstall, update

**Parameters:** action, category, repository

### ℹ️ system_info
Get MCP server information and status.

**Returns:** server_name, version, features

### 🏠 scene
Manage and activate Home Assistant scenes.

**Operations:** list, activate

**Parameters:** action, scene_id

---

## 🎯 Available Prompts (10)

The server includes guided prompts for common tasks:

1. **create_automation** - Interactive automation creation wizard
2. **debug_automation** - Troubleshoot automation issues
3. **troubleshoot_entity** - Diagnose entity problems
4. **routine_optimizer** - Optimize daily routines and schedules
5. **automation_health_check** - Analyze automation performance
6. **entity_naming_consistency** - Check and fix entity naming
7. **dashboard_layout_generator** - Generate dashboard layouts
8. **energy_optimization** - Analyze and optimize energy usage
9. **security_audit** - Review security configuration
10. **backup_strategy** - Backup recommendations and planning

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
