# SSE Statistics Tool

The SSE Statistics tool provides functionality to monitor and analyze Server-Sent Events (SSE) connections and performance in your Home Assistant MCP instance.

## Features

- Monitor active SSE connections
- Track connection statistics
- Analyze event delivery
- Monitor resource usage
- Connection management
- Performance metrics
- Historical data
- Alert configuration

## Usage

### REST API

```typescript
GET /api/sse/stats
GET /api/sse/connections
GET /api/sse/connections/{connection_id}
GET /api/sse/metrics
GET /api/sse/history
```

### WebSocket

```typescript
// Get SSE stats
{
    "type": "get_sse_stats"
}

// Get connection details
{
    "type": "get_sse_connection",
    "connection_id": "required_connection_id"
}

// Get performance metrics
{
    "type": "get_sse_metrics",
    "period": "1h|24h|7d|30d"
}
```

## Examples

### Get Current Statistics

```typescript
const response = await fetch('http://your-ha-mcp/api/sse/stats', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const stats = await response.json();
```

### Get Connection Details

```typescript
const response = await fetch('http://your-ha-mcp/api/sse/connections/conn_123', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const connection = await response.json();
```

### Get Performance Metrics

```typescript
const response = await fetch('http://your-ha-mcp/api/sse/metrics?period=24h', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const metrics = await response.json();
```

## Response Format

### Statistics Response

```json
{
    "success": true,
    "data": {
        "active_connections": 42,
        "total_events_sent": 12345,
        "events_per_second": 5.2,
        "memory_usage": 128974848,
        "cpu_usage": 2.5,
        "uptime": "PT24H",
        "event_backlog": 0
    }
}
```

### Connection Details Response

```json
{
    "success": true,
    "data": {
        "connection": {
            "id": "conn_123",
            "client_id": "client_456",
            "user_id": "user_789",
            "connected_at": "2024-02-05T12:00:00Z",
            "last_event_at": "2024-02-05T12:05:00Z",
            "events_sent": 150,
            "subscriptions": [
                {
                    "event_type": "state_changed",
                    "entity_id": "light.living_room"
                }
            ],
            "state": "active",
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0 ..."
        }
    }
}
```

### Performance Metrics Response

```json
{
    "success": true,
    "data": {
        "metrics": {
            "connections": {
                "current": 42,
                "max": 100,
                "average": 35.5
            },
            "events": {
                "total": 12345,
                "rate": {
                    "current": 5.2,
                    "max": 15.0,
                    "average": 4.8
                }
            },
            "latency": {
                "p50": 15,
                "p95": 45,
                "p99": 100
            },
            "resources": {
                "memory": {
                    "current": 128974848,
                    "max": 536870912
                },
                "cpu": {
                    "current": 2.5,
                    "max": 10.0,
                    "average": 3.2
                }
            }
        },
        "period": "24h",
        "timestamp": "2024-02-05T12:00:00Z"
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Connection not found
- `401`: Unauthorized
- `400`: Invalid request parameters
- `503`: Service overloaded

### Error Response Format

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE"
}
```

## Monitoring Metrics

### Connection Metrics
- Active connections
- Connection duration
- Connection state
- Client information
- Geographic distribution
- Protocol version

### Event Metrics
- Events per second
- Event types distribution
- Delivery success rate
- Event latency
- Queue size
- Backlog size

### Resource Metrics
- Memory usage
- CPU usage
- Network bandwidth
- Disk I/O
- Connection pool status
- Thread pool status

## Alert Thresholds

- Connection limits
- Event rate limits
- Resource usage limits
- Latency thresholds
- Error rate thresholds
- Backlog thresholds

## Best Practices

1. Monitor connection health
2. Track resource usage
3. Set up alerts
4. Analyze usage patterns
5. Optimize performance
6. Plan capacity
7. Implement failover
8. Regular maintenance

## Performance Optimization

- Connection pooling
- Event batching
- Resource throttling
- Load balancing
- Cache optimization
- Connection cleanup

## See Also

- [Event Subscription](subscribe-events.md)
- [Device Control](../device-management/control.md)
- [Automation Management](../automation/automation.md) 