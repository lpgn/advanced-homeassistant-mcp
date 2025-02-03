# Home Assistant MCP Tools

This section documents all available tools in the Home Assistant MCP.

## Available Tools

### Device Management

1. [List Devices](./list-devices.md)
   - List all available Home Assistant devices
   - Group devices by domain
   - Get device states and attributes

2. [Device Control](./control.md)
   - Control various device types
   - Support for lights, switches, covers, climate devices
   - Domain-specific commands and parameters

### History and State

1. [History](./history.md)
   - Fetch device state history
   - Filter by time range
   - Get significant changes

2. [Scene Management](./scene.md)
   - List available scenes
   - Activate scenes
   - Scene state information

### Automation

1. [Automation Management](./automation.md)
   - List automations
   - Toggle automation state
   - Trigger automations manually

2. [Automation Configuration](./automation-config.md)
   - Create new automations
   - Update existing automations
   - Delete automations
   - Duplicate automations

### Add-ons and Packages

1. [Add-on Management](./addon.md)
   - List available add-ons
   - Install/uninstall add-ons
   - Start/stop/restart add-ons
   - Get add-on information

2. [Package Management](./package.md)
   - Manage HACS packages
   - Install/update/remove packages
   - List available packages by category

### Notifications

1. [Notify](./notify.md)
   - Send notifications
   - Support for multiple notification services
   - Custom notification data

### Real-time Events

1. [Event Subscription](./subscribe-events.md)
   - Subscribe to Home Assistant events
   - Monitor specific entities
   - Domain-based monitoring

2. [SSE Statistics](./sse-stats.md)
   - Get SSE connection statistics
   - Monitor active subscriptions
   - Connection management

## Using Tools

All tools can be accessed through:

1. REST API endpoints
2. WebSocket connections
3. Server-Sent Events (SSE)

### Authentication

Tools require authentication using:
- Home Assistant Long-Lived Access Token
- JWT tokens for specific operations

### Error Handling

All tools follow a consistent error handling pattern:
```typescript
{
    success: boolean;
    message?: string;
    data?: any;
}
```

### Rate Limiting

Tools are subject to rate limiting:
- Default: 100 requests per 15 minutes
- Configurable through environment variables

## Tool Development

Want to create a new tool? Check out:
- [Tool Development Guide](../development/tools.md)
- [Tool Interface Documentation](../development/interfaces.md)
- [Best Practices](../development/best-practices.md)

## Examples

Each tool documentation includes:
- Usage examples
- Code snippets
- Common use cases
- Troubleshooting tips

## Support

Need help with tools?
- Check individual tool documentation
- See [Troubleshooting Guide](../troubleshooting.md)
- Create an issue on GitHub 