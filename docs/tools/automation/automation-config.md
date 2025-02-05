# Automation Configuration Tool

The Automation Configuration tool provides functionality to create, update, and manage Home Assistant automation configurations.

## Features

- Create new automations
- Update existing automations
- Delete automations
- Duplicate automations
- Import/Export automation configurations
- Validate automation configurations

## Usage

### REST API

```typescript
POST /api/automations
PUT /api/automations/{automation_id}
DELETE /api/automations/{automation_id}
POST /api/automations/{automation_id}/duplicate
POST /api/automations/validate
```

### WebSocket

```typescript
// Create automation
{
    "type": "create_automation",
    "automation": {
        // Automation configuration
    }
}

// Update automation
{
    "type": "update_automation",
    "automation_id": "required_automation_id",
    "automation": {
        // Updated configuration
    }
}

// Delete automation
{
    "type": "delete_automation",
    "automation_id": "required_automation_id"
}
```

## Automation Configuration

### Basic Structure

```json
{
    "id": "morning_routine",
    "alias": "Morning Routine",
    "description": "Turn on lights and adjust temperature in the morning",
    "trigger": [
        {
            "platform": "time",
            "at": "07:00:00"
        }
    ],
    "condition": [
        {
            "condition": "time",
            "weekday": ["mon", "tue", "wed", "thu", "fri"]
        }
    ],
    "action": [
        {
            "service": "light.turn_on",
            "target": {
                "entity_id": "light.bedroom"
            },
            "data": {
                "brightness": 255,
                "transition": 300
            }
        }
    ],
    "mode": "single"
}
```

### Trigger Types

```json
// Time-based trigger
{
    "platform": "time",
    "at": "07:00:00"
}

// State-based trigger
{
    "platform": "state",
    "entity_id": "binary_sensor.motion",
    "to": "on"
}

// Event-based trigger
{
    "platform": "event",
    "event_type": "custom_event"
}

// Numeric state trigger
{
    "platform": "numeric_state",
    "entity_id": "sensor.temperature",
    "above": 25
}
```

### Condition Types

```json
// Time condition
{
    "condition": "time",
    "after": "07:00:00",
    "before": "22:00:00"
}

// State condition
{
    "condition": "state",
    "entity_id": "device_tracker.phone",
    "state": "home"
}

// Numeric state condition
{
    "condition": "numeric_state",
    "entity_id": "sensor.temperature",
    "below": 25
}
```

### Action Types

```json
// Service call action
{
    "service": "light.turn_on",
    "target": {
        "entity_id": "light.bedroom"
    }
}

// Delay action
{
    "delay": "00:00:30"
}

// Scene activation
{
    "scene": "scene.evening_mode"
}

// Conditional action
{
    "choose": [
        {
            "conditions": [
                {
                    "condition": "state",
                    "entity_id": "sun.sun",
                    "state": "below_horizon"
                }
            ],
            "sequence": [
                {
                    "service": "light.turn_on",
                    "target": {
                        "entity_id": "light.living_room"
                    }
                }
            ]
        }
    ]
}
```

## Examples

### Create New Automation

```typescript
const response = await fetch('http://your-ha-mcp/api/automations', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "alias": "Morning Routine",
        "description": "Turn on lights in the morning",
        "trigger": [
            {
                "platform": "time",
                "at": "07:00:00"
            }
        ],
        "action": [
            {
                "service": "light.turn_on",
                "target": {
                    "entity_id": "light.bedroom"
                }
            }
        ]
    })
});
```

### Update Existing Automation

```typescript
const response = await fetch('http://your-ha-mcp/api/automations/morning_routine', {
    method: 'PUT',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "alias": "Morning Routine",
        "trigger": [
            {
                "platform": "time",
                "at": "07:30:00"  // Updated time
            }
        ],
        "action": [
            {
                "service": "light.turn_on",
                "target": {
                    "entity_id": "light.bedroom"
                }
            }
        ]
    })
});
```

## Response Format

### Success Response

```json
{
    "success": true,
    "data": {
        "automation": {
            "id": "created_automation_id",
            // Full automation configuration
        }
    }
}
```

### Validation Response

```json
{
    "success": true,
    "data": {
        "valid": true,
        "warnings": [
            "No conditions specified"
        ]
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Automation not found
- `401`: Unauthorized
- `400`: Invalid configuration
- `409`: Automation creation/update failed

### Error Response Format

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE",
    "validation_errors": [
        {
            "path": "trigger[0].platform",
            "message": "Invalid trigger platform"
        }
    ]
}
```

## Best Practices

1. Always validate configurations before saving
2. Use descriptive aliases and descriptions
3. Group related automations
4. Test automations in a safe environment
5. Document automation dependencies
6. Use variables for reusable values
7. Implement proper error handling
8. Consider automation modes carefully

## See Also

- [Automation Management](automation.md)
- [Event Subscription](../events/subscribe-events.md)
- [Scene Management](../history-state/scene.md) 