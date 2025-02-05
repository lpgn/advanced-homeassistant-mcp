---
layout: default
title: Core Functions
parent: API Reference
nav_order: 3
---

# Core Functions API 🔧

The Core Functions API provides the fundamental operations for interacting with Home Assistant devices and services through MCP Server.

## Device Control

### Get Device State

Retrieve the current state of devices.

```http
GET /api/state
GET /api/state/{entity_id}
```

Parameters:
- `entity_id` (optional): Specific device ID to query

```bash
# Get all states
curl http://localhost:3000/api/state

# Get specific device state
curl http://localhost:3000/api/state/light.living_room
```

Response:
```json
{
  "entity_id": "light.living_room",
  "state": "on",
  "attributes": {
    "brightness": 255,
    "color_temp": 370,
    "friendly_name": "Living Room Light"
  },
  "last_changed": "2024-01-20T15:30:00Z"
}
```

### Control Device

Execute device commands.

```http
POST /api/device/control
```

Request body:
```json
{
  "entity_id": "light.living_room",
  "action": "turn_on",
  "parameters": {
    "brightness": 200,
    "color_temp": 400
  }
}
```

Available actions:
- `turn_on`
- `turn_off`
- `toggle`
- `set_value`

Example with curl:
```bash
curl -X POST http://localhost:3000/api/device/control \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "entity_id": "light.living_room",
    "action": "turn_on",
    "parameters": {
      "brightness": 200
    }
  }'
```

## Natural Language Commands

### Execute Command

Process natural language commands.

```http
POST /api/command
```

Request body:
```json
{
  "command": "Turn on the living room lights and set them to 50% brightness"
}
```

Example usage:
```bash
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "command": "Turn on the living room lights and set them to 50% brightness"
  }'
```

Response:
```json
{
  "success": true,
  "actions": [
    {
      "entity_id": "light.living_room",
      "action": "turn_on",
      "parameters": {
        "brightness": 127
      },
      "status": "completed"
    }
  ],
  "message": "Command executed successfully"
}
```

## Scene Management

### Create Scene

Define a new scene with multiple actions.

```http
POST /api/scene
```

Request body:
```json
{
  "name": "Movie Night",
  "description": "Perfect lighting for movie watching",
  "actions": [
    {
      "entity_id": "light.living_room",
      "action": "turn_on",
      "parameters": {
        "brightness": 50,
        "color_temp": 500
      }
    },
    {
      "entity_id": "cover.living_room",
      "action": "close"
    }
  ]
}
```

### Activate Scene

Trigger a predefined scene.

```http
POST /api/scene/{scene_name}/activate
```

Example:
```bash
curl -X POST http://localhost:3000/api/scene/movie_night/activate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Groups

### Create Device Group

Create a group of devices for collective control.

```http
POST /api/group
```

Request body:
```json
{
  "name": "Living Room",
  "entities": [
    "light.living_room_main",
    "light.living_room_accent",
    "switch.living_room_fan"
  ]
}
```

### Control Group

Control multiple devices in a group.

```http
POST /api/group/{group_name}/control
```

Request body:
```json
{
  "action": "turn_off"
}
```

## System Operations

### Health Check

Check server status and connectivity.

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "homeAssistant": {
    "connected": true,
    "version": "2024.1.0"
  }
}
```

### Configuration

Get current server configuration.

```http
GET /api/config
```

Response:
```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "version": "1.0.0"
  },
  "homeAssistant": {
    "url": "http://homeassistant:8123",
    "connected": true
  },
  "features": {
    "nlp": true,
    "scenes": true,
    "groups": true
  }
}
```

## Error Handling

All endpoints follow standard HTTP status codes and return detailed error messages:

```json
{
  "error": true,
  "code": "INVALID_ENTITY",
  "message": "Device 'light.nonexistent' not found",
  "details": {
    "entity_id": "light.nonexistent",
    "available_entities": [
      "light.living_room",
      "light.kitchen"
    ]
  }
}
```

Common error codes:
- `INVALID_ENTITY`: Device not found
- `INVALID_ACTION`: Unsupported action
- `INVALID_PARAMETERS`: Invalid command parameters
- `AUTHENTICATION_ERROR`: Invalid or missing token
- `CONNECTION_ERROR`: Home Assistant connection issue

## TypeScript Interfaces

```typescript
interface DeviceState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
}

interface DeviceCommand {
  entity_id: string;
  action: 'turn_on' | 'turn_off' | 'toggle' | 'set_value';
  parameters?: Record<string, any>;
}

interface Scene {
  name: string;
  description?: string;
  actions: DeviceCommand[];
}

interface Group {
  name: string;
  entities: string[];
}
```

## Related Resources

- [API Overview](index.md)
- [SSE API](sse.md)
- [Architecture](../architecture.md)
- [Examples](https://github.com/jango-blockchained/advanced-homeassistant-mcp/tree/main/examples) 