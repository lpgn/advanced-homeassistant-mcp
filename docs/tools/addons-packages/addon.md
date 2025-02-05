# Add-on Management Tool

The Add-on Management tool provides functionality to manage Home Assistant add-ons through the MCP interface.

## Features

- List available add-ons
- Install/uninstall add-ons
- Start/stop/restart add-ons
- Get add-on information
- Update add-ons
- Configure add-ons
- View add-on logs
- Monitor add-on status

## Usage

### REST API

```typescript
GET /api/addons
GET /api/addons/{addon_slug}
POST /api/addons/{addon_slug}/install
POST /api/addons/{addon_slug}/uninstall
POST /api/addons/{addon_slug}/start
POST /api/addons/{addon_slug}/stop
POST /api/addons/{addon_slug}/restart
GET /api/addons/{addon_slug}/logs
PUT /api/addons/{addon_slug}/config
GET /api/addons/{addon_slug}/stats
```

### WebSocket

```typescript
// List add-ons
{
    "type": "get_addons"
}

// Get add-on info
{
    "type": "get_addon_info",
    "addon_slug": "required_addon_slug"
}

// Install add-on
{
    "type": "install_addon",
    "addon_slug": "required_addon_slug",
    "version": "optional_version"
}

// Control add-on
{
    "type": "control_addon",
    "addon_slug": "required_addon_slug",
    "action": "start|stop|restart"
}
```

## Examples

### List All Add-ons

```typescript
const response = await fetch('http://your-ha-mcp/api/addons', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const addons = await response.json();
```

### Install Add-on

```typescript
const response = await fetch('http://your-ha-mcp/api/addons/mosquitto/install', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "version": "latest"
    })
});
```

### Configure Add-on

```typescript
const response = await fetch('http://your-ha-mcp/api/addons/mosquitto/config', {
    method: 'PUT',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "logins": [
            {
                "username": "mqtt_user",
                "password": "mqtt_password"
            }
        ],
        "customize": {
            "active": true,
            "folder": "mosquitto"
        }
    })
});
```

## Response Format

### Add-on List Response

```json
{
    "success": true,
    "data": {
        "addons": [
            {
                "slug": "addon_slug",
                "name": "Add-on Name",
                "version": "1.0.0",
                "state": "started",
                "repository": "core",
                "installed": true,
                "update_available": false
            }
        ]
    }
}
```

### Add-on Info Response

```json
{
    "success": true,
    "data": {
        "addon": {
            "slug": "addon_slug",
            "name": "Add-on Name",
            "version": "1.0.0",
            "description": "Add-on description",
            "long_description": "Detailed description",
            "repository": "core",
            "installed": true,
            "state": "started",
            "webui": "http://[HOST]:[PORT:80]",
            "boot": "auto",
            "options": {
                // Add-on specific options
            },
            "schema": {
                // Add-on options schema
            },
            "ports": {
                "80/tcp": 8080
            },
            "ingress": true,
            "ingress_port": 8099
        }
    }
}
```

### Add-on Stats Response

```json
{
    "success": true,
    "data": {
        "stats": {
            "cpu_percent": 2.5,
            "memory_usage": 128974848,
            "memory_limit": 536870912,
            "network_rx": 1234,
            "network_tx": 5678,
            "blk_read": 12345,
            "blk_write": 67890
        }
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Add-on not found
- `401`: Unauthorized
- `400`: Invalid request
- `409`: Add-on operation failed
- `422`: Invalid configuration

### Error Response Format

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE"
}
```

## Rate Limiting

- Default limit: 50 requests per 15 minutes
- Configurable through environment variables:
  - `ADDON_RATE_LIMIT`
  - `ADDON_RATE_WINDOW`

## Best Practices

1. Always check add-on compatibility
2. Back up configurations before updates
3. Monitor resource usage
4. Use appropriate update strategies
5. Implement proper error handling
6. Test configurations in safe environment
7. Handle rate limiting gracefully
8. Keep add-ons updated

## Add-on Security

- Use secure passwords
- Regularly update add-ons
- Monitor add-on logs
- Restrict network access
- Use SSL/TLS when available
- Follow principle of least privilege

## See Also

- [Package Management](package.md)
- [Device Control](../device-management/control.md)
- [Event Subscription](../events/subscribe-events.md) 