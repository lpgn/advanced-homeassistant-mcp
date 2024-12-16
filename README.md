# Model Context Protocol Server for Home Assistant

A powerful bridge between your Home Assistant instance and Language Learning Models (LLMs), enabling natural language control and monitoring of your smart home devices through the Model Context Protocol (MCP).

## Key Features

- **Smart Device Control** 🎮
  - 💡 **Lights**: Brightness, color temperature, RGB color
  - 🌡️ **Climate**: Temperature, HVAC modes, fan modes, humidity
  - 🚪 **Covers**: Position and tilt control
  - 🔌 **Switches**: On/off control
  - 🚨 **Sensors**: State monitoring
- **Intelligent Organization** 🏠
  - Area and floor-based device grouping
  - State monitoring and querying
  - Smart context awareness
- **Robust Architecture** 🛠️
  - Comprehensive error handling
  - State validation
  - Secure API integration

## Quick Start

### Prerequisites

- Node.js 20.10.0+ (for Array.prototype.toSorted())
- NPM
- Running Home Assistant instance
- Home Assistant long-lived access token

### Basic Installation

```bash
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp
npm install
npm run build
```

### Docker Setup (Recommended)

1. Clone and prepare:
```bash
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp
```

2. Configure environment:
```env
NODE_ENV=production
HASS_HOST=your_home_assistant_url
HASS_TOKEN=your_home_assistant_token
```

3. Launch:
```bash
docker-compose up -d
```

## Usage Guide

### Device Discovery
```json
{
  "tool": "list_devices"
}
```

### Basic Controls
```json
// Light control
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "light.living_room",
  "brightness": 128
}

// Climate control
{
  "tool": "control",
  "command": "set_temperature",
  "entity_id": "climate.bedroom",
  "temperature": 22
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

## Development

```bash
npm run dev      # Development mode
npm run build    # Build project
npm test         # Run tests
```

## Troubleshooting

### Common Issues
1. Node.js Version (`toSorted is not a function`)
   - Solution: Update to Node.js 20.10.0+
2. Connection Issues
   - Verify Home Assistant is running
   - Check HASS_HOST accessibility
   - Validate token permissions

## Project Status

✅ **Complete**
- Entity, Floor, and Area access
- Device control (Lights, Climate, Covers, Switches)
- Basic state management

🚧 **In Progress**
- Custom prompt testing
- Resource context integration
- Tool organization optimization

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/introduction)
- [Home Assistant Docs](https://www.home-assistant.io)
- [HA REST API](https://developers.home-assistant.io/docs/api/rest)

## Contributing

1. Fork repository
2. Create feature branch
3. Submit pull request

## License

MIT License - See [LICENSE](LICENSE) file
