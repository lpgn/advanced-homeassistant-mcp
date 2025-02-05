---
layout: default
title: SSE API
parent: API Reference
nav_order: 2
---

# Server-Sent Events (SSE) API 📡

The SSE API provides real-time updates about device states and events from your Home Assistant setup. This guide covers how to use and implement SSE connections in your applications.

## Overview

Server-Sent Events (SSE) is a standard that enables servers to push real-time updates to clients over HTTP connections. MCP Server uses SSE to provide:

- Real-time device state updates
- Event notifications
- System status changes
- Command execution results

## Basic Usage

### Establishing a Connection

Create an EventSource connection to receive updates:

```javascript
const eventSource = new EventSource('http://localhost:3000/subscribe_events?token=YOUR_JWT_TOKEN');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received update:', data);
};
```

### Connection States

Handle different connection states:

```javascript
eventSource.onopen = () => {
    console.log('Connection established');
};

eventSource.onerror = (error) => {
    console.error('Connection error:', error);
    // Implement reconnection logic if needed
};
```

## Event Types

### Device State Events

Subscribe to all device state changes:

```javascript
const stateEvents = new EventSource('http://localhost:3000/subscribe_events?type=state');

stateEvents.onmessage = (event) => {
    const state = JSON.parse(event.data);
    console.log('Device state changed:', state);
};
```

Example state event:
```json
{
  "type": "state_changed",
  "entity_id": "light.living_room",
  "state": "on",
  "attributes": {
    "brightness": 255,
    "color_temp": 370
  },
  "timestamp": "2024-01-20T15:30:00Z"
}
```

### Filtered Subscriptions

#### By Domain
Subscribe to specific device types:

```javascript
// Subscribe to only light events
const lightEvents = new EventSource('http://localhost:3000/subscribe_events?domain=light');

// Subscribe to multiple domains
const multiEvents = new EventSource('http://localhost:3000/subscribe_events?domain=light,switch,sensor');
```

#### By Entity ID
Subscribe to specific devices:

```javascript
// Single entity
const livingRoomLight = new EventSource(
    'http://localhost:3000/subscribe_events?entity_id=light.living_room'
);

// Multiple entities
const kitchenDevices = new EventSource(
    'http://localhost:3000/subscribe_events?entity_id=light.kitchen,switch.coffee_maker'
);
```

## Advanced Usage

### Connection Management

Implement robust connection handling:

```javascript
class SSEManager {
    constructor(url, options = {}) {
        this.url = url;
        this.options = {
            maxRetries: 3,
            retryDelay: 1000,
            ...options
        };
        this.retryCount = 0;
        this.connect();
    }

    connect() {
        this.eventSource = new EventSource(this.url);
        
        this.eventSource.onopen = () => {
            this.retryCount = 0;
            console.log('Connected to SSE stream');
        };

        this.eventSource.onerror = (error) => {
            this.handleError(error);
        };

        this.eventSource.onmessage = (event) => {
            this.handleMessage(event);
        };
    }

    handleError(error) {
        console.error('SSE Error:', error);
        this.eventSource.close();

        if (this.retryCount < this.options.maxRetries) {
            this.retryCount++;
            setTimeout(() => {
                console.log(`Retrying connection (${this.retryCount}/${this.options.maxRetries})`);
                this.connect();
            }, this.options.retryDelay * this.retryCount);
        }
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            // Handle the event data
            console.log('Received:', data);
        } catch (error) {
            console.error('Error parsing SSE data:', error);
        }
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
        }
    }
}

// Usage
const sseManager = new SSEManager('http://localhost:3000/subscribe_events?token=YOUR_TOKEN');
```

### Event Filtering

Filter events on the client side:

```javascript
class EventFilter {
    constructor(conditions) {
        this.conditions = conditions;
    }

    matches(event) {
        return Object.entries(this.conditions).every(([key, value]) => {
            if (Array.isArray(value)) {
                return value.includes(event[key]);
            }
            return event[key] === value;
        });
    }
}

// Usage
const filter = new EventFilter({
    domain: ['light', 'switch'],
    state: 'on'
});

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (filter.matches(data)) {
        console.log('Matched event:', data);
    }
};
```

## Best Practices

1. **Authentication**
   - Always include authentication tokens
   - Implement token refresh mechanisms
   - Handle authentication errors gracefully

2. **Error Handling**
   - Implement progressive retry logic
   - Log connection issues
   - Notify users of connection status

3. **Resource Management**
   - Close EventSource connections when not needed
   - Limit the number of concurrent connections
   - Use filtered subscriptions when possible

4. **Performance**
   - Process events efficiently
   - Batch UI updates
   - Consider debouncing frequent updates

## Common Issues

### Connection Drops
If the connection drops, the EventSource will automatically attempt to reconnect. You can customize this behavior:

```javascript
eventSource.addEventListener('error', (error) => {
    if (eventSource.readyState === EventSource.CLOSED) {
        // Connection closed, implement custom retry logic
    }
});
```

### Memory Leaks
Always clean up EventSource connections:

```javascript
// In a React component
useEffect(() => {
    const eventSource = new EventSource('http://localhost:3000/subscribe_events');
    
    return () => {
        eventSource.close(); // Cleanup on unmount
    };
}, []);
```

## Related Resources

- [API Overview](index.md)
- [Core Functions](core.md)
- [WebSocket API](index.md#websocket-api)
- [Troubleshooting](../troubleshooting.md) 