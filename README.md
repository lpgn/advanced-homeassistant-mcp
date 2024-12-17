# Model Context Protocol Server for Home Assistant

*Forked from [tevonsb/homeassistant-mcp](https://github.com/tevonsb/homeassistant-mcp)*

A powerful bridge between your Home Assistant instance and Language Learning Models (LLMs), enabling natural language control and monitoring of your smart home devices through the Model Context Protocol (MCP).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.10.0-green.svg)
![Docker Compose](https://img.shields.io/badge/docker-compose-%3E%3D1.27.0-blue.svg)
![NPM](https://img.shields.io/badge/npm-%3E%3D7.0.0-orange.svg)

## Table of Contents

- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Basic Setup](#basic-setup)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
- [Configuration](#configuration)
- [Development](#development)
- [Supported Commands](#supported-commands)
- [Natural Language Integration](#natural-language-integration)
- [Troubleshooting](#troubleshooting)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [Resources](#resources)
- [License](#license)

## Key Features

- **Smart Device Control** 🎮
  - 💡 **Lights**: Brightness, color temperature, RGB color
  - 🌡️ **Climate**: Temperature, HVAC modes, fan modes, humidity
  - 🚪 **Covers**: Position and tilt control
  - 🔌 **Switches**: On/off control
  - 🚨 **Sensors & Contacts**: State monitoring
- **Intelligent Organization** 🏠
  - Area and floor-based device grouping
  - State monitoring and querying
  - Smart context awareness
- **Robust Architecture** 🛠️
  - Comprehensive error handling
  - State validation
  - Secure API integration

## Prerequisites

- **Node.js** 20.10.0 or higher
- **NPM** package manager
- **Docker Compose** for containerization
- Running **Home Assistant** instance
- Home Assistant long-lived access token ([How to get token](https://community.home-assistant.io/t/how-to-get-long-lived-access-token/162159))

## Installation

### Basic Setup

```bash
# Clone the repository
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Docker Setup

> Note: This setup is currently in progress. You can use the `docker` branch to get the latest changes.

1. **Clone and prepare:**
    ```bash
    git clone -b docker https://github.com/jango-blockchained/homeassistant-mcp.git
    cd homeassistant-mcp
    cp .env.example .env
    ```

2. **Configure environment `.env` file:**
    ```env
    ...
    HASS_TOKEN=your_home_assistant_token
    ...
    ```

3. **Launch with Docker Compose:**
    ```bash
    docker-compose up -d
    ```

## Configuration

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

Configure environment `.env` file:
```env
...
HASS_TOKEN=your_home_assistant_token
...
```

## Development

```bash
npm run dev      # Development mode
npm run build    # Build project
npm run start    # Production mode
npx jest --config=jest.config.cjs  # Run tests
```

## Supported Commands

### Common Entity Controls
```json
{
  "tool": "control",
  "command": "turn_on",  // or "turn_off", "toggle"
  "entity_id": "light.living_room"
}
```

### Light Control
```json
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "light.living_room",
  "brightness": 128,
  "color_temp": 4000,
  "rgb_color": [255, 0, 0]
}
```

### Climate Control
```json
{
  "tool": "control",
  "command": "set_temperature",
  "entity_id": "climate.bedroom",
  "temperature": 22,
  "hvac_mode": "heat",
  "fan_mode": "auto",
  "humidity": 45
}
```

### Cover Control
```json
{
  "tool": "control",
  "command": "set_position",
  "entity_id": "cover.living_room",
  "position": 50,
  "tilt_position": 45
}
```

### Media Player Control
```json
{
  "tool": "control",
  "command": "media_play",  // or "media_pause", "media_stop", "media_next", "media_previous"
  "entity_id": "media_player.living_room",
  "volume_level": 0.5,
  "source": "Spotify",
  "media_content_id": "spotify:playlist:xyz",
  "media_content_type": "playlist"
}
```

### Fan Control
```json
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "fan.bedroom",
  "percentage": 50,
  "preset_mode": "auto",
  "oscillating": true,
  "direction": "forward"
}
```

### Lock Control
```json
{
  "tool": "control",
  "command": "lock",  // or "unlock"
  "entity_id": "lock.front_door"
}
```

### Vacuum Control
```json
{
  "tool": "control",
  "command": "start",  // or "pause", "stop", "return_to_base", "clean_spot"
  "entity_id": "vacuum.robot",
  "fan_speed": "medium"
}
```

### Scene Control
```json
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "scene.movie_night"
}
```

### Script Control
```json
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "script.welcome_home",
  "variables": {
    "brightness": 100,
    "color": "red"
  }
}
```

### Camera Control
```json
{
  "tool": "control",
  "command": "enable_motion_detection",  // or "disable_motion_detection"
  "entity_id": "camera.front_door"
}
```

## Natural Language Integration

### Example Commands
- "Turn on the living room lights"
- "Set bedroom temperature to 22 degrees"
- "Is the front door locked?"

### Smart Features
- Context awareness across conversations
- Natural parameter interpretation
- Intelligent error prevention
- Multi-device orchestration

## Troubleshooting

### Common Issues
1. **Node.js Version (`toSorted is not a function`)**
   - **Solution:** Update to Node.js 20.10.0+
2. **Connection Issues**
   - Verify Home Assistant is running
   - Check `HASS_HOST` accessibility
   - Validate token permissions
3. **Entity Control Issues**
   - Verify `entity_id` exists
   - Check entity domain matches command
   - Ensure parameter values are valid

## Project Status

✅ **Complete**
- Entity, Floor, and Area access
- Device control (Lights, Climate, Covers, Switches, Contacts)
- Basic state management
- Error handling and validation
- Docker containerization and configuration
- Jest testing setup and TypeScript integration
- Environment variable management
- Home Assistant API integration
- Project documentation and README organization

🚧 **In Progress**
- Custom prompt testing and optimization
- Resource context integration
- Tool organization optimization
- Enhanced macOS integration
- Type safety improvements
- Testing coverage expansion

🔜 **Planned**
- Multi-platform desktop integration
- Advanced error recovery mechanisms
- Performance optimization
- WebSocket implementation for real-time updates
- Enhanced security features
- API documentation generation

## Contributing

1. Fork repository
2. Create feature branch
3. Submit pull request

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/introduction)
- [Home Assistant Docs](https://www.home-assistant.io)
- [HA REST API](https://developers.home-assistant.io/docs/api/rest)

## License

MIT License - See [LICENSE](LICENSE) file
