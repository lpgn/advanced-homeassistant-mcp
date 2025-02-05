# Automation Management Tool

The Automation Management tool provides functionality to manage and control Home Assistant automations.

## Features

- List all automations
- Get automation details
- Toggle automation state (enable/disable)
- Trigger automations manually
- Monitor automation execution
- View automation history

## Usage

### REST API

```typescript
GET /api/automations
GET /api/automations/{automation_id}
POST /api/automations/{automation_id}/toggle
POST /api/automations/{automation_id}/trigger
GET /api/automations/{automation_id}/history
```

### WebSocket

```typescript
// List automations
{
    "type": "get_automations"
}

// Toggle automation
{
    "type": "toggle_automation",
    "automation_id": "required_automation_id"
}

// Trigger automation
{
    "type": "trigger_automation",
    "automation_id": "required_automation_id",
    "variables": {
        // Optional variables
    }
}
```

## Examples

### List All Automations

```typescript
const response = await fetch('http://your-ha-mcp/api/automations', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const automations = await response.json();
```

### Toggle Automation State

```typescript
const response = await fetch('http://your-ha-mcp/api/automations/morning_routine/toggle', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
```

### Trigger Automation Manually

```typescript
const response = await fetch('http://your-ha-mcp/api/automations/morning_routine/trigger', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "variables": {
            "brightness": 100,
            "temperature": 22
        }
    })
});
```

## Response Format

### Automation List Response

```json
{
    "success": true,
    "data": {
        "automations": [
            {
                "id": "automation_id",
                "name": "Automation Name",
                "enabled": true,
                "last_triggered": "2024-02-05T12:00:00Z",
                "trigger_count": 42
            }
        ]
    }
}
```

### Automation Details Response

```json
{
    "success": true,
    "data": {
        "automation": {
            "id": "automation_id",
            "name": "Automation Name",
            "enabled": true,
            "triggers": [
                {
                    "platform": "time",
                    "at": "07:00:00"
                }
            ],
            "conditions": [],
            "actions": [
                {
                    "service": "light.turn_on",
                    "target": {
                        "entity_id": "light.bedroom"
                    }
                }
            ],
            "mode": "single",
            "max": 10,
            "last_triggered": "2024-02-05T12:00:00Z",
            "trigger_count": 42
        }
    }
}
```

### Automation History Response

```json
{
    "success": true,
    "data": {
        "history": [
            {
                "timestamp": "2024-02-05T12:00:00Z",
                "trigger": {
                    "platform": "time",
                    "at": "07:00:00"
                },
                "context": {
                    "user_id": "user_123",
                    "variables": {}
                },
                "result": "success"
            }
        ]
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Automation not found
- `401`: Unauthorized
- `400`: Invalid request
- `409`: Automation execution failed

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
  - `AUTOMATION_RATE_LIMIT`
  - `AUTOMATION_RATE_WINDOW`

## Best Practices

1. Monitor automation execution history
2. Use descriptive automation names
3. Implement proper error handling
4. Cache automation configurations when possible
5. Handle rate limiting gracefully
6. Test automations before enabling
7. Use variables for flexible automation behavior

## See Also

- [Automation Configuration](automation-config.md)
- [Event Subscription](../events/subscribe-events.md)
- [Device Control](../device-management/control.md) 