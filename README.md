# Model Context Protocol Server for Home Assistant

The server uses the MCP protocol to share access to a local Home Assistant instance with an LLM application.

A powerful bridge between your Home Assistant instance and Language Learning Models (LLMs), enabling natural language control and monitoring of your smart home devices through the Model Context Protocol (MCP). This server provides a comprehensive API for managing your entire Home Assistant ecosystem, from device control to system administration.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.26-black)
![Docker Compose](https://img.shields.io/badge/docker-compose-%3E%3D1.27.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)
![Test Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)

## Features

- 🎮 **Device Control**: Control any Home Assistant device through natural language
- 🔄 **Real-time Updates**: Get instant updates through Server-Sent Events (SSE)
- 🤖 **Automation Management**: Create, update, and manage automations
- 📊 **State Monitoring**: Track and query device states
- 🔐 **Secure**: Token-based authentication and rate limiting
- 📱 **Mobile Ready**: Works with any HTTP-capable client

## Real-time Updates with SSE

The server includes a powerful Server-Sent Events (SSE) system that provides real-time updates from your Home Assistant instance. This allows you to:

- 🔄 Get instant state changes for any device
- 📡 Monitor automation triggers and executions
- 🎯 Subscribe to specific domains or entities
- 📊 Track service calls and script executions

### Quick SSE Example

```javascript
const eventSource = new EventSource(
  'http://localhost:3000/subscribe_events?token=YOUR_TOKEN&domain=light'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update received:', data);
};
```

See [SSE_API.md](docs/SSE_API.md) for complete documentation of the SSE system.

## Table of Contents

- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Basic Setup](#basic-setup)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
- [Configuration](#configuration)
- [Development](#development)
- [API Reference](#api-reference)
- [OpenAI Integration](#openai-integration)
- [Natural Language Integration](#natural-language-integration)
- [Troubleshooting](#troubleshooting)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [Resources](#resources)
- [License](#license)

## Key Features

### Core Functionality 🎮
- **Smart Device Control**
  - 💡 **Lights**: Brightness, color temperature, RGB color
  - 🌡️ **Climate**: Temperature, HVAC modes, fan modes, humidity
  - 🚪 **Covers**: Position and tilt control
  - 🔌 **Switches**: On/off control
  - 🚨 **Sensors & Contacts**: State monitoring
  - 🎵 **Media Players**: Playback control, volume, source selection
  - 🌪️ **Fans**: Speed, oscillation, direction
  - 🔒 **Locks**: Lock/unlock control
  - 🧹 **Vacuums**: Start, stop, return to base
  - 📹 **Cameras**: Motion detection, snapshots

### System Management 🛠️
- **Add-on Management**
  - Browse available add-ons
  - Install/uninstall add-ons
  - Start/stop/restart add-ons
  - Version management
  - Configuration access

- **Package Management (HACS)**
  - Integration with Home Assistant Community Store
  - Multiple package types support:
    - Custom integrations
    - Frontend themes
    - Python scripts
    - AppDaemon apps
    - NetDaemon apps
  - Version control and updates
  - Repository management

- **Automation Management**
  - Create and edit automations
  - Advanced configuration options:
    - Multiple trigger types
    - Complex conditions
    - Action sequences
    - Execution modes
  - Duplicate and modify existing automations
  - Enable/disable automation rules
  - Trigger automation manually

### Architecture Features 🏗️
- **Intelligent Organization**
  - Area and floor-based device grouping
  - State monitoring and querying
  - Smart context awareness
  - Historical data access

- **Robust Architecture**
  - Comprehensive error handling
  - State validation
  - Secure API integration
  - TypeScript type safety
  - Extensive test coverage

## Prerequisites

- **Bun** 1.0.26 or higher (Required for optimal performance)
- **Docker Compose** for containerization
- Running **Home Assistant** instance
- Home Assistant long-lived access token ([How to get token](https://community.home-assistant.io/t/how-to-get-long-lived-access-token/162159))
- **HACS** installed for package management features
- **Supervisor** access for add-on management

## Installation

### Basic Setup

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Clone the repository
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp

# Install dependencies
bun install

# Build the project
bun run build
```

### Docker Setup (Recommended)

The project includes Docker support with Bun for optimal performance and consistent environments across different platforms.

1. **Clone the repository:**
    ```bash
    git clone https://github.com/jango-blockchained/homeassistant-mcp.git
    cd homeassistant-mcp
    ```

2. **Configure environment:**
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file with your Home Assistant configuration:
    ```env
    # Home Assistant Configuration
    HASS_HOST=http://homeassistant.local:8123
    HASS_TOKEN=your_home_assistant_token
    HASS_SOCKET_URL=ws://homeassistant.local:8123/api/websocket

    # Server Configuration
    PORT=3000
    BUN_ENV=production
    DEBUG=false
    ```

3. **Build and run with Docker Compose:**
    ```bash
    # Build and start the containers
    docker compose up -d

    # View logs
    docker compose logs -f

    # Stop the service
    docker compose down
    ```

4. **Verify the installation:**
    The server should now be running at `http://localhost:3000`. You can check the health endpoint at `http://localhost:3000/health`.

5. **Update the application:**
    ```bash
    # Pull the latest changes
    git pull

    # Rebuild and restart the containers
    docker compose up -d --build
    ```

#### Docker Configuration

The Docker setup includes:
- Multi-stage build using Bun for optimal performance
- Health checks for container monitoring
- Volume mounting for environment configuration
- Automatic container restart on failure
- Exposed port 3000 for API access

#### Docker Compose Environment Variables

All environment variables can be configured in the `.env` file. The following variables are supported:
- `HASS_HOST`: Your Home Assistant instance URL
- `HASS_TOKEN`: Long-lived access token for Home Assistant
- `HASS_SOCKET_URL`: WebSocket URL for Home Assistant
- `PORT`: Server port (default: 3000)
- `BUN_ENV`: Environment (production/development)
- `DEBUG`: Enable debug mode (true/false)

## Configuration

### Environment Variables

```env
# Home Assistant Configuration
HASS_HOST=http://homeassistant.local:8123  # Your Home Assistant instance URL
HASS_TOKEN=your_home_assistant_token       # Long-lived access token
HASS_SOCKET_URL=ws://homeassistant.local:8123/api/websocket  # WebSocket URL

# Server Configuration
PORT=3000                # Server port (default: 3000)
BUN_ENV=production     # Environment (production/development)
DEBUG=false            # Enable debug mode

# Test Configuration
TEST_HASS_HOST=http://localhost:8123  # Test instance URL
TEST_HASS_TOKEN=test_token           # Test token
```

### Configuration Files

1. **Development**: Copy `.env.example` to `.env.development`
2. **Production**: Copy `.env.example` to `.env.production`
3. **Testing**: Copy `.env.example` to `.env.test`

## Development

```bash
# Development mode with hot reload and TypeScript watch
bun run dev

# Run tests with Bun's built-in test runner
bun test

# Run tests with coverage
bun test --coverage

# Build the project
bun run build

# Start the production server
bun start
```

## API Reference

For detailed API documentation, please refer to:
- [API Documentation](docs/API.md) - Complete API reference
- [SSE API Documentation](docs/SSE_API.md) - Server-Sent Events documentation

## OpenAI Integration

The server includes powerful AI analysis capabilities powered by OpenAI's GPT-4 model. This feature provides intelligent analysis of your Home Assistant setup through two main modes:

### 1. Standard Analysis

Performs a comprehensive system analysis including:
- System Overview
- Performance Analysis
- Security Assessment
- Optimization Recommendations
- Maintenance Tasks

```bash
# Run standard analysis
bun run test:openai
# Select option 1 when prompted
```

### 2. Custom Prompt Analysis

Allows you to ask specific questions about your Home Assistant setup. The analysis can include:
- Device States
- Configuration Details
- Active Devices
- Device Attributes (brightness, temperature, etc.)

```bash
# Run custom analysis
bun run test:openai
# Select option 2 when prompted
```

### Configuration

To use the OpenAI integration, you need to set up your OpenAI API key in the `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Verify Home Assistant is running
   - Check `HASS_HOST` accessibility
   - Validate token permissions
   - Ensure WebSocket connection for real-time updates

2. **Add-on Management Issues**
   - Verify Supervisor access
   - Check add-on compatibility
   - Validate system resources

3. **HACS Integration Issues**
   - Verify HACS installation
   - Check HACS integration status
   - Validate repository access

4. **Automation Issues**
   - Verify entity availability
   - Check trigger conditions
   - Validate service calls
   - Monitor execution logs

## Project Status

### Current Status 🚀

The project is actively maintained and under continuous development. Recent updates include:

- ✅ Enhanced Bun runtime optimization
- ✅ Improved WebSocket connection management
- ✅ Advanced type safety and error handling
- ✅ Comprehensive test coverage with Bun's test runner
- ✅ Real-time event handling optimization
- ✅ Enhanced Docker integration with Bun
- ✅ Improved development workflow
- ✅ Advanced security features

### Upcoming Features 🔜

- 📱 Mobile-first UI improvements with modern frameworks
- 🔐 Advanced security features and authentication methods
- 🤖 AI-powered automation capabilities
- 📊 Real-time analytics and reporting dashboard
- 🌐 Multi-instance support with load balancing
- 🔄 Enhanced state synchronization
- 🎯 Custom automation templates
- 🔍 Advanced entity search and filtering
- 📈 Performance monitoring tools
- 🛠️ Enhanced debugging capabilities

### Performance Optimizations

- ⚡ Bun's high-performance JavaScript runtime
- 🚀 Optimized WebSocket connections
- 📦 Efficient package management with Bun
- 🔄 Enhanced state management
- 🎯 Targeted event subscriptions
- 📊 Memory usage optimizations
- 🔍 Query optimization
- 🛠️ Development tools integration

### Version History

- **v0.2.0** (Current)
  - Enhanced Bun runtime implementation
  - Advanced WebSocket management
  - Improved error handling and recovery
  - Comprehensive test suite with Bun's test runner
  - Real-time performance optimizations
  - Enhanced security features
  - Advanced automation capabilities
  - Improved documentation

- **v0.1.0**
  - Initial release with Bun support
  - Basic Home Assistant integration
  - SSE implementation
  - Device control capabilities
  - Basic automation support

## Performance Benefits with Bun

This project leverages Bun's high-performance runtime for:

- 🚀 **Ultra-Fast Execution**: Bun's JavaScript runtime offers superior performance
- ⚡ **Quick Development**: Hot reload and TypeScript support out of the box
- 📦 **Efficient Package Management**: Lightning-fast installation and dependency resolution
- 🧪 **Integrated Testing**: Built-in test runner with superior performance
- 🔄 **Native TypeScript Support**: Zero-config TypeScript support
- 🎯 **Optimized Build Process**: Faster builds and smaller output
- 🛠️ **Development Tools**: Enhanced debugging and profiling
- 📊 **Performance Monitoring**: Built-in metrics and diagnostics

## Development Workflow

### Testing with Bun

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test path/to/test.test.ts
```

### Building with Bun

```bash
# Build the project
bun run build

# Clean and rebuild
bun run clean && bun run build
```

### Type Checking

```bash
# Check types
bun run types:check

# Install type definitions
bun run types:install
```

### Linting

```bash
# Run ESLint
bun run lint

# Fix linting issues
bun run lint:fix
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies (`bun install`)
4. Make your changes
5. Run tests (`bun test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Advanced Features

### Real-time Monitoring

- 📊 Live device state tracking
- 🔄 Instant state updates
- 📈 Performance metrics
- 🎯 Event filtering
- 🔍 Advanced search capabilities

### Security Features

- 🔐 Token-based authentication
- 🛡️ Rate limiting
- 🔒 SSL/TLS support
- 👤 User management
- 📝 Audit logging

### Automation Capabilities

- 🤖 Complex automation rules
- 📅 Scheduled tasks
- 🎯 Conditional triggers
- 🔄 State-based actions
- 📊 Automation analytics

### Development Tools

- 🛠️ Built-in debugging
- 📊 Performance profiling
- 🔍 Code analysis
- 🧪 Test coverage reports
- 📝 Documentation generation

## License

MIT License - See [LICENSE](LICENSE) file
