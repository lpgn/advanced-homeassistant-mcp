# Scene Management Tool

The Scene Management tool provides functionality to manage and control scenes in your Home Assistant instance.

## Features

- List available scenes
- Activate scenes
- Create new scenes
- Update existing scenes
- Delete scenes
- Get scene state information

## Usage

### REST API

```typescript
GET /api/scenes
GET /api/scenes/{scene_id}
POST /api/scenes/{scene_id}/activate
POST /api/scenes
PUT /api/scenes/{scene_id}
DELETE /api/scenes/{scene_id}
```

### WebSocket

```typescript
// List scenes
{
    "type": "get_scenes"
}

// Activate scene
{
    "type": "activate_scene",
    "scene_id": "required_scene_id"
}

// Create/Update scene
{
    "type": "create_scene",
    "scene": {
        "name": "required_scene_name",
        "entities": {
            // Entity states
        }
    }
}
```

## Scene Configuration

### Scene Definition

```json
{
    "name": "Movie Night",
    "entities": {
        "light.living_room": {
            "state": "on",
            "brightness": 50,
            "color_temp": 2700
        },
        "cover.living_room": {
            "state": "closed"
        },
        "media_player.tv": {
            "state": "on",
            "source": "HDMI 1"
        }
    }
}
```

## Examples

### List All Scenes

```typescript
const response = await fetch('http://your-ha-mcp/api/scenes', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const scenes = await response.json();
```

### Activate a Scene

```typescript
const response = await fetch('http://your-ha-mcp/api/scenes/movie_night/activate', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
```

### Create a New Scene

```typescript
const response = await fetch('http://your-ha-mcp/api/scenes', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "name": "Movie Night",
        "entities": {
            "light.living_room": {
                "state": "on",
                "brightness": 50
            },
            "cover.living_room": {
                "state": "closed"
            }
        }
    })
});
```

## Response Format

### Scene List Response

```json
{
    "success": true,
    "data": {
        "scenes": [
            {
                "id": "scene_id",
                "name": "Scene Name",
                "entities": {
                    // Entity configurations
                }
            }
        ]
    }
}
```

### Scene Activation Response

```json
{
    "success": true,
    "data": {
        "scene_id": "activated_scene_id",
        "status": "activated",
        "timestamp": "2024-02-05T12:00:00Z"
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Scene not found
- `401`: Unauthorized
- `400`: Invalid scene configuration
- `409`: Scene activation failed

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
  - `SCENE_RATE_LIMIT`
  - `SCENE_RATE_WINDOW`

## Best Practices

1. Validate entity availability before creating scenes
2. Use meaningful scene names
3. Group related entities in scenes
4. Implement proper error handling
5. Cache scene configurations when possible
6. Handle rate limiting gracefully

## Scene Transitions

Scenes can include transition settings for smooth state changes:

```json
{
    "name": "Sunset Mode",
    "entities": {
        "light.living_room": {
            "state": "on",
            "brightness": 128,
            "transition": 5  // 5 seconds
        }
    }
}
```

## See Also

- [Device Control](../device-management/control.md)
- [Device History](history.md)
- [Automation Management](../automation/automation.md) 