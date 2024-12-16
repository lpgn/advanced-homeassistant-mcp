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

- Node.js 20.10.0 or higher
- NPM package manager
- A running Home Assistant instance
- A long-lived access token from Home Assistant

## Installation

```bash
# Clone the repository
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
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
   NODE_ENV=development
   HASS_HOST=your_home_assistant_url  # e.g., http://homeassistant.local:8123
   HASS_TOKEN=your_home_assistant_token
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
                   "HASS_TOKEN": "your_home_assistant_token",
                   "HASS_HOST": "your_home_assistant_url"
               }
           }
       }
   }
   ```

## How to Use

The server provides two main tools for interacting with Home Assistant:

### 1. List Devices Tool

Use this tool to discover all available devices and their current states:

```json
{
  "tool": "list_devices"
}
```

This will return a structured response with all devices grouped by domain:

```json
{
  "success": true,
  "devices": {
    "light": [
      {
        "entity_id": "light.living_room",
        "state": "on",
        "attributes": {
          "brightness": 128,
          "color_temp": 4000,
          "friendly_name": "Living Room Light"
        }
      }
    ],
    "climate": [
      {
        "entity_id": "climate.bedroom",
        "state": "heat",
        "attributes": {
          "temperature": 22,
          "hvac_mode": "heat",
          "friendly_name": "Bedroom Thermostat"
        }
      }
    ]
  }
}
```

### 2. Control Tool

Use this tool to control your devices. Here are some common usage examples:

#### Light Control

```json
// Turn on a light
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "light.living_room"
}

// Set brightness
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "light.living_room",
  "brightness": 128
}

// Set color temperature
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "light.living_room",
  "color_temp": 4000
}

// Set RGB color (red)
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "light.living_room",
  "rgb_color": [255, 0, 0]
}
```

#### Climate Control

```json
// Set temperature
{
  "tool": "control",
  "command": "set_temperature",
  "entity_id": "climate.living_room",
  "temperature": 22
}

// Set HVAC mode
{
  "tool": "control",
  "command": "set_hvac_mode",
  "entity_id": "climate.living_room",
  "hvac_mode": "heat"
}

// Set fan mode
{
  "tool": "control",
  "command": "set_fan_mode",
  "entity_id": "climate.living_room",
  "fan_mode": "auto"
}
```

#### Cover Control

```json
// Open/Close cover
{
  "tool": "control",
  "command": "open_cover",  // or "close_cover"
  "entity_id": "cover.living_room"
}

// Set position
{
  "tool": "control",
  "command": "set_position",
  "entity_id": "cover.living_room",
  "position": 50
}

// Set tilt
{
  "tool": "control",
  "command": "set_tilt_position",
  "entity_id": "cover.living_room",
  "tilt_position": 45
}
```

#### Switch Control

```json
// Turn on/off
{
  "tool": "control",
  "command": "turn_on",  // or "turn_off"
  "entity_id": "switch.office"
}

// Toggle
{
  "tool": "control",
  "command": "toggle",
  "entity_id": "switch.office"
}
```

### Error Handling

The server provides clear error messages when something goes wrong:

```json
{
  "success": false,
  "message": "Failed to execute set_temperature for light.living_room: Unsupported operation for domain: light"
}
```

Common error scenarios:
1. Invalid entity ID
2. Unsupported operation for domain
3. Invalid parameter values
4. Home Assistant connection issues

### Best Practices

1. **Entity Discovery**
   - Always use `list_devices` first to discover available entities
   - Note the supported attributes for each device

2. **Parameter Validation**
   - Brightness: 0-255
   - Position/Tilt: 0-100
   - Temperature: Depends on your system's configuration
   - Color temperature: Typically 2000-6500K

3. **Error Recovery**
   - If a command fails, check:
     - Entity ID exists and is correct
     - Command is supported by the domain
     - Parameters are within valid ranges

4. **State Awareness**
   - Use `list_devices` to check current state before making changes
   - Verify command execution by checking state afterward

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
   - Check the HASS_HOST is correct and accessible
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

## Using with LLMs (AI Assistants)

The MCP server is designed to work seamlessly with AI language models. Here's how to interact with your Home Assistant using natural language:

### Natural Language Examples

1. **Discovering Devices**
   ```
   "What devices do I have in my home?"
   "Show me all my lights"
   "List the climate controls in the bedroom"
   ```
   The LLM will use the `list_devices` tool to fetch and present this information in a human-readable format.

2. **Basic Controls**
   ```
   "Turn on the living room lights"
   "Set the bedroom temperature to 22 degrees"
   "Close all the blinds"
   ```
   The LLM will translate these commands into appropriate tool calls using the `control` tool.

3. **Complex Operations**
   ```
   "Make the living room cozy for movie night"
   → LLM might:
   - Dim the lights (set brightness to 30%)
   - Set warm color temperature
   - Lower the blinds
   - Adjust the temperature

   "Set up my morning routine"
   → LLM might:
   - Open the bedroom blinds
   - Turn on specific lights
   - Adjust the thermostat
   ```

4. **State-Aware Commands**
   ```
   "Is my front door closed?"
   "Which lights are currently on?"
   "What's the temperature in the bedroom?"
   ```
   The LLM will check current states using `list_devices` before responding.

### Context and Memory

The LLM can maintain context across multiple interactions:

```
User: "How warm is it in the bedroom?"
LLM: [checks temperature] "The bedroom is currently 20°C"
User: "Make it a bit warmer"
LLM: [remembers context, adjusts by reasonable increment] "I'll increase it to 22°C"
```

### Natural Parameter Handling

The LLM can interpret natural language into specific parameters:

```
"Make the lights very dim" → brightness: 10%
"Set a comfortable temperature" → temperature: 21-23°C
"Change the lights to a warm color" → color_temp: ~2700K
```

### Intelligent Error Prevention

The LLM will:
1. Validate commands before execution
2. Check device capabilities
3. Ensure parameters are within acceptable ranges
4. Provide helpful feedback if a command can't be executed

Example:
```
User: "Set the kitchen light to blue"
LLM: [checks if the light supports RGB]
- If supported: Sets rgb_color to [0, 0, 255]
- If not supported: "I'm sorry, but your kitchen light doesn't support color changes. I can only adjust its brightness."
```

### Best Practices for LLM Interactions

1. **Be Specific with Locations**
   - Good: "Turn on the kitchen lights"
   - Better: "Turn on the lights above the kitchen counter"

2. **Use Natural Increments**
   - "Make it a little brighter" → +20% brightness
   - "Make it much warmer" → +3-4°C

3. **Group Related Commands**
   ```
   "Set up the living room for watching TV:
   - Dim the lights to 20%
   - Set them to a warm color
   - Lower the blinds
   - Set the temperature to 22 degrees"
   ```

4. **Ask for Confirmation**
   ```
   User: "Turn off all lights"
   LLM: "I'll turn off all 12 lights in your home. Would you like me to proceed?"
   ```

### Handling Complex Scenarios

1. **Conditional Commands**
   ```
   "If the temperature is above 25°C, turn on the fan"
   → LLM will:
   1. Check current temperature
   2. Execute command if condition is met
   ```

2. **Time-Based Context**
   ```
   "Set up my evening lighting"
   → LLM considers:
   - Time of day
   - Current light levels
   - User preferences
   ```

3. **Multi-Room Coordination**
   ```
   "Prepare the house for bedtime"
   → LLM orchestrates:
   - Turning off main living area lights
   - Dimming hallway lights
   - Setting night mode temperatures
   - Ensuring doors are locked
   ```

### Troubleshooting with LLMs

The LLM can help diagnose issues:
```
User: "The living room lights aren't responding"
LLM: Let me check:
1. Verifies device availability
2. Checks current state
3. Reviews recent commands
4. Suggests potential solutions
```

### Security Considerations

1. **Confirmation for Critical Actions**
   - The LLM will ask for confirmation before:
     - Controlling security devices
     - Making large temperature changes
     - Executing commands affecting multiple devices

2. **Permission Awareness**
   - The LLM respects device permissions
   - Provides clear feedback when actions aren't permitted
