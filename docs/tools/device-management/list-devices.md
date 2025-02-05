# List Devices Tool

The List Devices tool provides functionality to retrieve and manage device information from your Home Assistant instance.

## Features

- List all available Home Assistant devices
- Group devices by domain
- Get device states and attributes
- Filter devices by various criteria

## Usage

### REST API

```typescript
GET /api/devices
GET /api/devices/{domain}
GET /api/devices/{device_id}/state
```

### WebSocket

```typescript
// List all devices
{
    "type": "list_devices",
    "domain": "optional_domain"
}

// Get device state
{
    "type": "get_device_state",
    "device_id": "required_device_id"
}
```

### Examples

#### List All Devices

```typescript
const response = await fetch('http://your-ha-mcp/api/devices', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const devices = await response.json();
```

#### Get Devices by Domain

```typescript
const response = await fetch('http://your-ha-mcp/api/devices/light', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const lightDevices = await response.json();
```

## Response Format

### Device List Response

```json
{
    "success": true,
    "data": {
        "devices": [
            {
                "id": "device_id",
                "name": "Device Name",
                "domain": "light",
                "state": "on",
                "attributes": {
                    "brightness": 255,
                    "color_temp": 370
                }
            }
        ]
    }
}
```

### Device State Response

```json
{
    "success": true,
    "data": {
        "state": "on",
        "attributes": {
            "brightness": 255,
            "color_temp": 370
        },
        "last_changed": "2024-02-05T12:00:00Z",
        "last_updated": "2024-02-05T12:00:00Z"
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Device not found
- `401`: Unauthorized
- `400`: Invalid request parameters

### Error Response Format

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE"
}
```

## Rate Limiting

- Default limit: 100 requests per 15 minutes
- Configurable through environment variables:
  - `DEVICE_LIST_RATE_LIMIT`
  - `DEVICE_LIST_RATE_WINDOW`

## Best Practices

1. Cache device lists when possible
2. Use domain filtering for better performance
3. Implement proper error handling
4. Handle rate limiting gracefully

## See Also

- [Device Control](control.md)
- [Device History](../history-state/history.md)
- [Event Subscription](../events/subscribe-events.md) 