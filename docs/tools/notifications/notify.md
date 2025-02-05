# Notification Tool

The Notification tool provides functionality to send notifications through various services in your Home Assistant instance.

## Features

- Send notifications
- Support for multiple notification services
- Custom notification data
- Rich media support
- Notification templates
- Delivery tracking
- Priority levels
- Notification groups

## Usage

### REST API

```typescript
POST /api/notify
POST /api/notify/{service_id}
GET /api/notify/services
GET /api/notify/history
```

### WebSocket

```typescript
// Send notification
{
    "type": "send_notification",
    "service": "required_service_id",
    "message": "required_message",
    "title": "optional_title",
    "data": {
        // Service-specific data
    }
}

// Get notification services
{
    "type": "get_notification_services"
}
```

## Supported Services

- Mobile App
- Email
- SMS
- Telegram
- Discord
- Slack
- Push Notifications
- Custom Services

## Examples

### Basic Notification

```typescript
const response = await fetch('http://your-ha-mcp/api/notify/mobile_app', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "message": "Motion detected in living room",
        "title": "Security Alert"
    })
});
```

### Rich Notification

```typescript
const response = await fetch('http://your-ha-mcp/api/notify/mobile_app', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "message": "Motion detected in living room",
        "title": "Security Alert",
        "data": {
            "image": "https://your-camera-snapshot.jpg",
            "actions": [
                {
                    "action": "view_camera",
                    "title": "View Camera"
                },
                {
                    "action": "dismiss",
                    "title": "Dismiss"
                }
            ],
            "priority": "high",
            "ttl": 3600,
            "group": "security"
        }
    })
});
```

### Service-Specific Example (Telegram)

```typescript
const response = await fetch('http://your-ha-mcp/api/notify/telegram', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "message": "Temperature is too high!",
        "title": "Climate Alert",
        "data": {
            "parse_mode": "markdown",
            "inline_keyboard": [
                [
                    {
                        "text": "Turn On AC",
                        "callback_data": "turn_on_ac"
                    }
                ]
            ]
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
        "notification_id": "notification_123",
        "status": "sent",
        "timestamp": "2024-02-05T12:00:00Z",
        "service": "mobile_app"
    }
}
```

### Services List Response

```json
{
    "success": true,
    "data": {
        "services": [
            {
                "id": "mobile_app",
                "name": "Mobile App",
                "enabled": true,
                "features": [
                    "actions",
                    "images",
                    "sound"
                ]
            }
        ]
    }
}
```

### Notification History Response

```json
{
    "success": true,
    "data": {
        "history": [
            {
                "id": "notification_123",
                "service": "mobile_app",
                "message": "Motion detected",
                "title": "Security Alert",
                "timestamp": "2024-02-05T12:00:00Z",
                "status": "delivered"
            }
        ]
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Service not found
- `401`: Unauthorized
- `400`: Invalid request
- `408`: Delivery timeout
- `422`: Invalid notification data

### Error Response Format

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE"
}
```

## Rate Limiting

- Default limit: 100 notifications per hour
- Configurable through environment variables:
  - `NOTIFY_RATE_LIMIT`
  - `NOTIFY_RATE_WINDOW`

## Best Practices

1. Use appropriate priority levels
2. Group related notifications
3. Include relevant context
4. Implement proper error handling
5. Use templates for consistency
6. Consider time zones
7. Respect user preferences
8. Handle rate limiting gracefully

## Notification Templates

```typescript
// Template example
{
    "template": "security_alert",
    "data": {
        "location": "living_room",
        "event_type": "motion",
        "timestamp": "2024-02-05T12:00:00Z"
    }
}
```

## See Also

- [Event Subscription](../events/subscribe-events.md)
- [Device Control](../device-management/control.md)
- [Automation Management](../automation/automation.md) 