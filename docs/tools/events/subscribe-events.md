# Event Subscription Tool

The Event Subscription tool provides functionality to subscribe to and monitor real-time events from your Home Assistant instance.

## Features

- Subscribe to Home Assistant events
- Monitor specific entities
- Domain-based monitoring
- Event filtering
- Real-time updates
- Event history
- Custom event handling
- Connection management

## Usage

### REST API

```typescript
POST /api/events/subscribe
DELETE /api/events/unsubscribe
GET /api/events/subscriptions
GET /api/events/history
```

### WebSocket

```typescript
// Subscribe to events
{
    "type": "subscribe_events",
    "event_type": "optional_event_type",
    "entity_id": "optional_entity_id",
    "domain": "optional_domain"
}

// Unsubscribe from events
{
    "type": "unsubscribe_events",
    "subscription_id": "required_subscription_id"
}
```

### Server-Sent Events (SSE)

```typescript
GET /api/events/stream?event_type=state_changed&entity_id=light.living_room
```

## Event Types

- `state_changed`: Entity state changes
- `automation_triggered`: Automation executions
- `scene_activated`: Scene activations
- `device_registered`: New device registrations
- `service_registered`: New service registrations
- `homeassistant_start`: System startup
- `homeassistant_stop`: System shutdown
- Custom events

## Examples

### Subscribe to All State Changes

```typescript
const response = await fetch('http://your-ha-mcp/api/events/subscribe', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "event_type": "state_changed"
    })
});
```

### Monitor Specific Entity

```typescript
const response = await fetch('http://your-ha-mcp/api/events/subscribe', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "event_type": "state_changed",
        "entity_id": "light.living_room"
    })
});
```

### Domain-Based Monitoring

```typescript
const response = await fetch('http://your-ha-mcp/api/events/subscribe', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "event_type": "state_changed",
        "domain": "light"
    })
});
```

### SSE Connection Example

```typescript
const eventSource = new EventSource(
    'http://your-ha-mcp/api/events/stream?event_type=state_changed&entity_id=light.living_room',
    {
        headers: {
            'Authorization': 'Bearer your_access_token'
        }
    }
);

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Event received:', data);
};

eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
};
```

## Response Format

### Subscription Response

```json
{
    "success": true,
    "data": {
        "subscription_id": "sub_123",
        "event_type": "state_changed",
        "entity_id": "light.living_room",
        "created_at": "2024-02-05T12:00:00Z"
    }
}
```

### Event Message Format

```json
{
    "event_type": "state_changed",
    "entity_id": "light.living_room",
    "data": {
        "old_state": {
            "state": "off",
            "attributes": {},
            "last_changed": "2024-02-05T11:55:00Z"
        },
        "new_state": {
            "state": "on",
            "attributes": {
                "brightness": 255
            },
            "last_changed": "2024-02-05T12:00:00Z"
        }
    },
    "origin": "LOCAL",
    "time_fired": "2024-02-05T12:00:00Z",
    "context": {
        "id": "context_123",
        "parent_id": null,
        "user_id": "user_123"
    }
}
```

### Subscriptions List Response

```json
{
    "success": true,
    "data": {
        "subscriptions": [
            {
                "id": "sub_123",
                "event_type": "state_changed",
                "entity_id": "light.living_room",
                "created_at": "2024-02-05T12:00:00Z",
                "last_event": "2024-02-05T12:05:00Z"
            }
        ]
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Event type not found
- `401`: Unauthorized
- `400`: Invalid subscription parameters
- `409`: Subscription already exists
- `429`: Too many subscriptions

### Error Response Format

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE"
}
```

## Rate Limiting

- Default limits:
  - Maximum subscriptions: 100 per client
  - Maximum event rate: 1000 events per minute
- Configurable through environment variables:
  - `EVENT_SUB_MAX_SUBSCRIPTIONS`
  - `EVENT_SUB_RATE_LIMIT`
  - `EVENT_SUB_RATE_WINDOW`

## Best Practices

1. Use specific event types when possible
2. Implement proper error handling
3. Handle connection interruptions
4. Process events asynchronously
5. Implement backoff strategies
6. Monitor subscription health
7. Clean up unused subscriptions
8. Handle rate limiting gracefully

## Connection Management

- Implement heartbeat monitoring
- Use reconnection strategies
- Handle connection timeouts
- Monitor connection quality
- Implement fallback mechanisms
- Clean up resources properly

## See Also

- [SSE Statistics](sse-stats.md)
- [Device Control](../device-management/control.md)
- [Automation Management](../automation/automation.md) 