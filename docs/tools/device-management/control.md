# Device Control Tool

The Device Control tool provides functionality to control various types of devices in your Home Assistant instance.

## Supported Device Types

- Lights
- Switches
- Covers
- Climate devices
- Media players
- And more...

## Usage

### REST API

```typescript
POST /api/devices/{device_id}/control
```

### WebSocket

```typescript
{
    "type": "control_device",
    "device_id": "required_device_id",
    "domain": "required_domain",
    "service": "required_service",
    "data": {
        // Service-specific data
    }
}
```

## Domain-Specific Commands

### Lights

```typescript
// Turn on/off
POST /api/devices/light/{device_id}/control
{
    "service": "turn_on",  // or "turn_off"
}

// Set brightness
{
    "service": "turn_on",
    "data": {
        "brightness": 255  // 0-255
    }
}

// Set color
{
    "service": "turn_on",
    "data": {
        "rgb_color": [255, 0, 0]  // Red
    }
}
```

### Covers

```typescript
// Open/close
POST /api/devices/cover/{device_id}/control
{
    "service": "open_cover",  // or "close_cover"
}

// Set position
{
    "service": "set_cover_position",
    "data": {
        "position": 50  // 0-100
    }
}
```

### Climate

```typescript
// Set temperature
POST /api/devices/climate/{device_id}/control
{
    "service": "set_temperature",
    "data": {
        "temperature": 22.5
    }
}

// Set mode
{
    "service": "set_hvac_mode",
    "data": {
        "hvac_mode": "heat"  // heat, cool, auto, off
    }
}
```

## Examples

### Control Light Brightness

```typescript
const response = await fetch('http://your-ha-mcp/api/devices/light/living_room/control', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "service": "turn_on",
        "data": {
            "brightness": 128
        }
    })
});
```

### Control Cover Position

```typescript
const response = await fetch('http://your-ha-mcp/api/devices/cover/bedroom/control', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "service": "set_cover_position",
        "data": {
            "position": 75
        }
    })
});
```

## Response Format

### Success Response

```json
{
    "success": true,
    "data": {
        "state": "on",
        "attributes": {
            // Updated device attributes
        }
    }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE"
}
```

## Error Handling

### Common Error Codes

- `404`: Device not found
- `401`: Unauthorized
- `400`: Invalid service or parameters
- `409`: Device unavailable or offline

## Rate Limiting

- Default limit: 100 requests per 15 minutes
- Configurable through environment variables:
  - `DEVICE_CONTROL_RATE_LIMIT`
  - `DEVICE_CONTROL_RATE_WINDOW`

## Best Practices

1. Validate device availability before sending commands
2. Implement proper error handling
3. Use appropriate retry strategies for failed commands
4. Cache device capabilities when possible
5. Handle rate limiting gracefully

## See Also

- [List Devices](list-devices.md)
- [Device History](../history-state/history.md)
- [Event Subscription](../events/subscribe-events.md) 