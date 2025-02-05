# Home Assistant MCP Server API Documentation

## Overview

This document provides a reference for the MCP Server API, which offers basic device control and state management for Home Assistant.

## Authentication

All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer YOUR_TOKEN
```

## Core Endpoints

### Device State Management

#### Get Device State
```http
GET /api/state/{entity_id}
```

**Response:**
```json
{
  "entity_id": "light.living_room",
  "state": "on",
  "attributes": {
    "brightness": 128
  }
}
```

#### Update Device State
```http
POST /api/state
Content-Type: application/json

{
  "entity_id": "light.living_room",
  "state": "on",
  "attributes": {
    "brightness": 128
  }
}
```

### Device Control

#### Execute Device Command
```http
POST /api/control
Content-Type: application/json

{
  "entity_id": "light.living_room",
  "command": "turn_on",
  "parameters": {
    "brightness": 50
  }
}
```

## Real-Time Updates

### WebSocket Connection
Connect to real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000/events');
ws.onmessage = (event) => {
  const deviceUpdate = JSON.parse(event.data);
  console.log('Device state changed:', deviceUpdate);
};
```

## Error Handling

### Common Error Responses

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": "Entity ID not found or invalid command"
  }
}
```

## Rate Limiting

Basic rate limiting is implemented:
- Maximum of 100 requests per minute
- Excess requests will receive a 429 Too Many Requests response

## Supported Operations

### Supported Commands
- `turn_on`
- `turn_off`
- `toggle`
- `set_brightness`
- `set_color`

### Supported Entities
- Lights
- Switches
- Climate controls
- Media players

## Limitations

- Limited to basic device control
- No advanced automation
- Minimal error handling
- Basic authentication

## Best Practices

1. Always include a valid JWT token
2. Handle potential errors in your client code
3. Use WebSocket for real-time updates when possible
4. Validate entity IDs before sending commands

## Example Client Usage

```typescript
async function controlDevice(entityId: string, command: string, params?: Record<string, unknown>) {
  try {
    const response = await fetch('/api/control', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        entity_id: entityId,
        command,
        parameters: params
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Device control failed:', error);
    throw error;
  }
}

// Usage example
controlDevice('light.living_room', 'turn_on', { brightness: 50 })
  .then(result => console.log('Device controlled successfully'))
  .catch(error => console.error('Control failed', error));
```

## Future Development

Planned improvements:
- Enhanced error handling
- More comprehensive device support
- Improved authentication mechanisms

*API is subject to change. Always refer to the latest documentation.*
