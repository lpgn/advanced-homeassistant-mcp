---
layout: default
title: Quick Start
parent: Getting Started
nav_order: 2
---

# Quick Start Guide 🚀

This guide will help you get started with MCP Server after installation. We'll cover basic usage, common commands, and simple integrations.

## First Steps

### 1. Verify Connection

After installation, verify your MCP Server is running and connected to Home Assistant:

```bash
# Check server health
curl http://localhost:3000/health

# Verify Home Assistant connection
curl http://localhost:3000/api/state
```

### 2. Basic Voice Commands

Try these basic voice commands to test your setup:

```bash
# Example using curl for testing
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "Turn on the living room lights"}'
```

Common voice commands:
- "Turn on/off [device name]"
- "Set [device] to [value]"
- "What's the temperature in [room]?"
- "Is [device] on or off?"

## Real-World Examples

### 1. Smart Lighting Control

```javascript
// Browser example using fetch
const response = await fetch('http://localhost:3000/api/command', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    command: 'Set living room lights to 50% brightness and warm white color'
  })
});
```

### 2. Real-Time Updates

Subscribe to device state changes using Server-Sent Events (SSE):

```javascript
const eventSource = new EventSource('http://localhost:3000/subscribe_events?token=YOUR_TOKEN&domain=light');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Device state changed:', data);
    // Update your UI here
};
```

### 3. Scene Automation

Create and trigger scenes for different activities:

```javascript
// Create a "Movie Night" scene
const createScene = async () => {
  await fetch('http://localhost:3000/api/scene', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Movie Night',
      actions: [
        { device: 'living_room_lights', action: 'dim', value: 20 },
        { device: 'tv', action: 'on' },
        { device: 'soundbar', action: 'on' }
      ]
    })
  });
};

// Trigger the scene with voice command:
// "Hey MCP, activate movie night scene"
```

## Integration Examples

### 1. Web Dashboard Integration

```javascript
// React component example
function SmartHomeControl() {
    const [devices, setDevices] = useState([]);
    
    useEffect(() => {
        // Subscribe to device updates
        const events = new EventSource('http://localhost:3000/subscribe_events');
        events.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setDevices(currentDevices => 
                currentDevices.map(device => 
                    device.id === data.id ? {...device, ...data} : device
                )
            );
        };
        
        return () => events.close();
    }, []);

    return (
        <div className="dashboard">
            {devices.map(device => (
                <DeviceCard key={device.id} device={device} />
            ))}
        </div>
    );
}
```

### 2. Voice Assistant Integration

```typescript
// Example using speech-to-text with MCP
async function handleVoiceCommand(audioBlob: Blob) {
    // First, convert speech to text
    const text = await speechToText(audioBlob);
    
    // Then send command to MCP
    const response = await fetch('http://localhost:3000/api/command', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: text })
    });
    
    return response.json();
}
```

## Best Practices

1. **Error Handling**
   ```javascript
   try {
       const response = await fetch('http://localhost:3000/api/command', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify({ command: 'Turn on lights' })
       });
       
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       const data = await response.json();
   } catch (error) {
       console.error('Error:', error);
       // Handle error appropriately
   }
   ```

2. **Connection Management**
   ```javascript
   class MCPConnection {
       constructor() {
           this.eventSource = null;
           this.reconnectAttempts = 0;
       }
       
       connect() {
           this.eventSource = new EventSource('http://localhost:3000/subscribe_events');
           this.eventSource.onerror = this.handleError.bind(this);
       }
       
       handleError() {
           if (this.reconnectAttempts < 3) {
               setTimeout(() => {
                   this.reconnectAttempts++;
                   this.connect();
               }, 1000 * this.reconnectAttempts);
           }
       }
   }
   ```

## Next Steps

- Explore the [API Documentation](../api/index.md) for advanced features
- Learn about [SSE API](../api/sse.md) for real-time updates
- Check out [Architecture](../architecture.md) for system design details
- Read the [Contributing Guide](../contributing.md) to get involved

## Troubleshooting

If you encounter issues:
- Verify your authentication token
- Check server logs for errors
- Ensure Home Assistant is accessible
- Review the [Troubleshooting Guide](../troubleshooting.md)

Need more help? Visit our [Support Resources](../index.md#support). 