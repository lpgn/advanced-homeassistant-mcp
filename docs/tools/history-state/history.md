# Device History Tool

The Device History tool allows you to retrieve historical state information for devices in your Home Assistant instance.

## Features

- Fetch device state history
- Filter by time range
- Get significant changes
- Aggregate data by time periods
- Export historical data

## Usage

### REST API

```typescript
GET /api/history/{device_id}
GET /api/history/{device_id}/period/{start_time}
GET /api/history/{device_id}/period/{start_time}/{end_time}
```

### WebSocket

```typescript
{
    "type": "get_history",
    "device_id": "required_device_id",
    "start_time": "optional_iso_timestamp",
    "end_time": "optional_iso_timestamp",
    "significant_changes_only": false
}
```

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_time` | ISO timestamp | Start of the period to fetch history for |
| `end_time` | ISO timestamp | End of the period to fetch history for |
| `significant_changes_only` | boolean | Only return significant state changes |
| `minimal_response` | boolean | Return minimal state information |
| `no_attributes` | boolean | Exclude attribute data from response |

## Examples

### Get Recent History

```typescript
const response = await fetch('http://your-ha-mcp/api/history/light.living_room', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const history = await response.json();
```

### Get History for Specific Period

```typescript
const startTime = '2024-02-01T00:00:00Z';
const endTime = '2024-02-02T00:00:00Z';
const response = await fetch(
    `http://your-ha-mcp/api/history/light.living_room/period/${startTime}/${endTime}`, 
    {
        headers: {
            'Authorization': 'Bearer your_access_token'
        }
    }
);
const history = await response.json();
```

## Response Format

### History Response

```json
{
    "success": true,
    "data": {
        "history": [
            {
                "state": "on",
                "attributes": {
                    "brightness": 255
                },
                "last_changed": "2024-02-05T12:00:00Z",
                "last_updated": "2024-02-05T12:00:00Z"
            },
            {
                "state": "off",
                "last_changed": "2024-02-05T13:00:00Z",
                "last_updated": "2024-02-05T13:00:00Z"
            }
        ]
    }
}
```

### Aggregated History Response

```json
{
    "success": true,
    "data": {
        "aggregates": {
            "daily": [
                {
                    "date": "2024-02-05",
                    "on_time": "PT5H30M",
                    "off_time": "PT18H30M",
                    "changes": 10
                }
            ]
        }
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Device not found
- `401`: Unauthorized
- `400`: Invalid parameters
- `416`: Time range too large

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
  - `HISTORY_RATE_LIMIT`
  - `HISTORY_RATE_WINDOW`

## Data Retention

- Default retention period: 30 days
- Configurable through environment variables:
  - `HISTORY_RETENTION_DAYS`
- Older data may be automatically aggregated

## Best Practices

1. Use appropriate time ranges to avoid large responses
2. Enable `significant_changes_only` for better performance
3. Use `minimal_response` when full state data isn't needed
4. Implement proper error handling
5. Cache frequently accessed historical data
6. Handle rate limiting gracefully

## See Also

- [List Devices](../device-management/list-devices.md)
- [Device Control](../device-management/control.md)
- [Scene Management](scene.md) 