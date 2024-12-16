# A Model Context Protocol Server for Home Assistant

The server uses the MCP protocol to share access to a local Home Assistant instance with an LLM application. It provides a comprehensive interface for controlling various Home Assistant entities through natural language.

## Features

- **Entity Control**: Full support for controlling common Home Assistant entities:
  - 💡 **Lights**: Brightness, color temperature, RGB color
  - 🌡️ **Climate**: Temperature, HVAC modes, fan modes, humidity
  - 🚪 **Covers**: Position control, tilt control
  - 🔌 **Switches**: Basic on/off control
  - 🚨 **Contacts**: State monitoring
- **Entity State Access**: Query and monitor entity states
- **Area and Floor Organization**: Logical grouping of devices
- **Robust Error Handling**: Clear error messages and state validation

## Prerequisites

- Node.js 16 or higher
- Yarn package manager
- A running Home Assistant instance
- A long-lived access token from Home Assistant

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/homeassistant-mcp.git
cd homeassistant-mcp

# Install dependencies
yarn install

# Build the server
yarn build
```

## Configuration

1. **Home Assistant Token**
   - Get a long-lived access token from Home Assistant
   - Guide: [How to get long-lived access token](https://community.home-assistant.io/t/how-to-get-long-lived-access-token/162159)

2. **Environment Variables**
   Create a `.env` file with:

   ```env
   TOKEN=your_home_assistant_token
   BASE_URL=your_home_assistant_url  # e.g., http://homeassistant.local:8123
   PORT=3000  # Optional, defaults to 3000
   ```

3. **MCP Client Configuration**
   Configure your MCP client (like Claude Desktop) with:

   ```json
   {
       "mcpServers": {
           "homeassistant": {
               "command": "node",
               "args": [
                   "/path/to/dist/index.js"
               ],
               "env": {
                   "TOKEN": "your_home_assistant_token",
                   "BASE_URL": "your_home_assistant_url"
               }
           }
       }
   }
   ```

## Supported Commands

### Common Commands (All Entities)

- `turn_on`: Turn entity on
- `turn_off`: Turn entity off
- `toggle`: Toggle entity state

### Light-Specific Commands

- Control brightness (0-255)

  ```json
  {
    "command": "turn_on",
    "entity_id": "light.living_room",
    "brightness": 128
  }
  ```

- Set color temperature

  ```json
  {
    "command": "turn_on",
    "entity_id": "light.living_room",
    "color_temp": 4000
  }
  ```

- Set RGB color values

  ```json
  {
    "command": "turn_on",
    "entity_id": "light.living_room",
    "rgb_color": [255, 0, 0]
  }
  ```

### Cover Commands

- `open`: Open cover
- `close`: Close cover
- `stop`: Stop cover movement
- `set_position`: Set cover position (0-100)

  ```json
  {
    "command": "set_position",
    "entity_id": "cover.living_room",
    "position": 50
  }
  ```

- `set_tilt_position`: Set cover tilt (0-100)

  ```json
  {
    "command": "set_tilt_position",
    "entity_id": "cover.living_room",
    "tilt_position": 45
  }
  ```

### Climate Commands

- `set_temperature`: Set target temperature

  ```json
  {
    "command": "set_temperature",
    "entity_id": "climate.living_room",
    "temperature": 22
  }
  ```

- `set_hvac_mode`: Set mode (off, heat, cool, heat_cool, auto, dry, fan_only)

  ```json
  {
    "command": "set_hvac_mode",
    "entity_id": "climate.living_room",
    "hvac_mode": "heat"
  }
  ```

- `set_fan_mode`: Set fan mode (auto, low, medium, high)

  ```json
  {
    "command": "set_fan_mode",
    "entity_id": "climate.living_room",
    "fan_mode": "auto"
  }
  ```

- `set_humidity`: Set target humidity (0-100)

  ```json
  {
    "command": "set_humidity",
    "entity_id": "climate.living_room",
    "humidity": 45
  }
  ```

## Development

```bash
# Run in development mode
yarn dev

# Build and start
yarn build:start

# Run tests
yarn test
```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify your Home Assistant instance is running
   - Check the BASE_URL is correct and accessible
   - Ensure your token has the required permissions

2. **Entity Control Issues**
   - Verify the entity_id exists in Home Assistant
   - Check the entity domain matches the command
   - Ensure parameter values are within valid ranges

3. **Permission Issues**
   - Verify your token has write permissions for the entity
   - Check Home Assistant logs for authorization errors

## Project Status

### Completed

- [x] Access to entities
- [x] Access to Floors
- [x] Access to Areas
- [x] Control for entities
  - [x] Lights
  - [x] Thermostats
  - [x] Covers
  - [x] Contacts
  - [x] Climates
  - [x] Switches

### In Progress

- [ ] Testing / writing custom prompts
- [ ] Testing using resources for high-level context
- [ ] Test varying tool organization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/introduction)
- [Home Assistant Documentation](https://www.home-assistant.io)
- [Home Assistant REST API](https://developers.home-assistant.io/docs/api/rest)
