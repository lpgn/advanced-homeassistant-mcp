---
layout: default
title: API Overview
parent: API Reference
nav_order: 1
has_children: false
---

# API Documentation 📚

Welcome to the MCP Server API documentation. This guide covers all available endpoints, authentication methods, and integration patterns.

## API Overview

The MCP Server provides several API categories:

1. **Core API** - Basic device control and state management
2. **SSE API** - Real-time event subscriptions
3. **Scene API** - Scene management and automation
4. **Voice API** - Natural language command processing

## Authentication

All API endpoints require authentication using JWT tokens:

```bash
# Include the token in your requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/api/state
```

To obtain a token:

```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

## Core Endpoints

### Device State

```http
GET /api/state
```

Retrieve the current state of all devices:

```bash
curl http://localhost:3000/api/state
```

Response:
```json
{
  "devices": [
    {
      "id": "light.living_room",
      "state": "on",
      "attributes": {
        "brightness": 255,
        "color_temp": 370
      }
    }
  ]
}
```

### Command Execution

```http
POST /api/command
```

Execute a natural language command:

```bash
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "Turn on the kitchen lights"}'
```

Response:
```json
{
  "success": true,
  "action": "turn_on",
  "device": "light.kitchen",
  "message": "Kitchen lights turned on"
}
```

## Real-Time Events

### Event Subscription

```http
GET /subscribe_events
```

Subscribe to device state changes:

```javascript
const eventSource = new EventSource('http://localhost:3000/subscribe_events?token=YOUR_TOKEN');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('State changed:', data);
};
```

### Filtered Subscriptions

Subscribe to specific device types:

```http
GET /subscribe_events?domain=light
GET /subscribe_events?entity_id=light.living_room
```

## Scene Management

### Create Scene

```http
POST /api/scene
```

Create a new scene:

```bash
curl -X POST http://localhost:3000/api/scene \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Movie Night",
    "actions": [
      {"device": "light.living_room", "action": "dim", "value": 20},
      {"device": "media_player.tv", "action": "on"}
    ]
  }'
```

### Activate Scene

```http
POST /api/scene/activate
```

Activate an existing scene:

```bash
curl -X POST http://localhost:3000/api/scene/activate \
  -H "Content-Type: application/json" \
  -d '{"name": "Movie Night"}'
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

Error responses include detailed messages:

```json
{
  "error": true,
  "message": "Device not found",
  "code": "DEVICE_NOT_FOUND",
  "details": {
    "device_id": "light.nonexistent"
  }
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

When exceeded, returns `429 Too Many Requests`:

```json
{
  "error": true,
  "message": "Rate limit exceeded",
  "reset": 1640995200
}
```

## WebSocket API

For bi-directional communication:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

ws.send(JSON.stringify({
    type: 'command',
    payload: {
        command: 'Turn on lights'
    }
}));
```

## API Versioning

The current API version is v1. Include the version in the URL:

```http
/api/v1/state
/api/v1/command
```

## Further Reading

- [SSE API Details](sse.md) - In-depth SSE documentation
- [Core Functions](core.md) - Detailed endpoint documentation
- [Architecture Overview](../architecture.md) - System design details
- [Troubleshooting](../troubleshooting.md) - Common issues and solutions

# API Reference

The Advanced Home Assistant MCP provides several APIs for integration and automation:

- [Core API](core.md) - Primary interface for system control
- [SSE API](sse.md) - Server-Sent Events for real-time updates
- [Core Functions](core.md) - Essential system functions 