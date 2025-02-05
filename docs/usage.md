# Usage Guide

This guide explains how to use the Home Assistant MCP Server for basic device management and integration.

## Basic Setup

1. **Starting the Server:**
   - Development mode: `bun run dev`
   - Production mode: `bun run start`

2. **Accessing the Server:**
   - Default URL: `http://localhost:3000`
   - Ensure Home Assistant credentials are configured in `.env`

## Device Control

### REST API Interactions

Basic device control can be performed via the REST API:

```typescript
// Turn on a light
fetch('http://localhost:3000/api/control', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    entity_id: 'light.living_room',
    command: 'turn_on',
    parameters: { brightness: 50 }
  })
});
```

### Supported Commands

- `turn_on`
- `turn_off`
- `toggle`
- `set_brightness`

### Supported Entities

- Lights
- Switches
- Climate controls
- Media players

## Real-Time Updates

### WebSocket Connection

Subscribe to real-time device state changes:

```typescript
const ws = new WebSocket('ws://localhost:3000/events');
ws.onmessage = (event) => {
  const deviceUpdate = JSON.parse(event.data);
  console.log('Device state changed:', deviceUpdate);
};
```

## Authentication

All API requests require a valid JWT token in the Authorization header.

## Limitations

- Basic device control only
- Limited error handling
- Minimal third-party integrations

## Troubleshooting

1. Verify Home Assistant connection
2. Check JWT token validity
3. Ensure correct entity IDs
4. Review server logs for detailed errors

## Configuration

Configure the server using environment variables in `.env`:

```
HA_URL=http://homeassistant:8123
HA_TOKEN=your_home_assistant_token
JWT_SECRET=your_jwt_secret
```

## Next Steps

- Explore the [API Documentation](api.md)
- Check [Troubleshooting Guide](troubleshooting.md)
- Review [Contributing Guidelines](contributing.md) 