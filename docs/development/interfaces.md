# Interface Documentation

This document describes the core interfaces used throughout the Home Assistant MCP.

## Core Interfaces

### Tool Interface

```typescript
interface Tool {
    /** Unique identifier for the tool */
    id: string;
    
    /** Human-readable name */
    name: string;
    
    /** Detailed description */
    description: string;
    
    /** Semantic version */
    version: string;
    
    /** Tool category */
    category: ToolCategory;
    
    /** Execute tool functionality */
    execute(params: any): Promise<ToolResult>;
}
```

### Tool Result

```typescript
interface ToolResult {
    /** Operation success status */
    success: boolean;
    
    /** Response data */
    data?: any;
    
    /** Error message if failed */
    message?: string;
    
    /** Error code if failed */
    error_code?: string;
}
```

### Tool Category

```typescript
enum ToolCategory {
    DeviceManagement = 'device_management',
    HistoryState = 'history_state',
    Automation = 'automation',
    AddonsPackages = 'addons_packages',
    Notifications = 'notifications',
    Events = 'events',
    Utility = 'utility'
}
```

## Event Interfaces

### Event Subscription

```typescript
interface EventSubscription {
    /** Unique subscription ID */
    id: string;
    
    /** Event type to subscribe to */
    event_type: string;
    
    /** Optional entity ID filter */
    entity_id?: string;
    
    /** Optional domain filter */
    domain?: string;
    
    /** Subscription creation timestamp */
    created_at: string;
    
    /** Last event timestamp */
    last_event?: string;
}
```

### Event Message

```typescript
interface EventMessage {
    /** Event type */
    event_type: string;
    
    /** Entity ID if applicable */
    entity_id?: string;
    
    /** Event data */
    data: any;
    
    /** Event origin */
    origin: 'LOCAL' | 'REMOTE';
    
    /** Event timestamp */
    time_fired: string;
    
    /** Event context */
    context: EventContext;
}
```

## Device Interfaces

### Device

```typescript
interface Device {
    /** Device ID */
    id: string;
    
    /** Device name */
    name: string;
    
    /** Device domain */
    domain: string;
    
    /** Current state */
    state: string;
    
    /** Device attributes */
    attributes: Record<string, any>;
    
    /** Device capabilities */
    capabilities: DeviceCapabilities;
}
```

### Device Capabilities

```typescript
interface DeviceCapabilities {
    /** Supported features */
    features: string[];
    
    /** Supported commands */
    commands: string[];
    
    /** State attributes */
    attributes: {
        /** Attribute name */
        [key: string]: {
            /** Attribute type */
            type: 'string' | 'number' | 'boolean' | 'object';
            /** Attribute description */
            description: string;
            /** Optional value constraints */
            constraints?: {
                min?: number;
                max?: number;
                enum?: any[];
            };
        };
    };
}
```

## Authentication Interfaces

### Auth Token

```typescript
interface AuthToken {
    /** Token value */
    token: string;
    
    /** Token type */
    type: 'bearer' | 'jwt';
    
    /** Expiration timestamp */
    expires_at: string;
    
    /** Token refresh info */
    refresh?: {
        token: string;
        expires_at: string;
    };
}
```

### User

```typescript
interface User {
    /** User ID */
    id: string;
    
    /** Username */
    username: string;
    
    /** User type */
    type: 'admin' | 'user' | 'service';
    
    /** User permissions */
    permissions: string[];
}
```

## Error Interfaces

### Tool Error

```typescript
interface ToolError extends Error {
    /** Error code */
    code: string;
    
    /** HTTP status code */
    status: number;
    
    /** Error details */
    details?: Record<string, any>;
}
```

### Validation Error

```typescript
interface ValidationError {
    /** Error path */
    path: string;
    
    /** Error message */
    message: string;
    
    /** Error code */
    code: string;
}
```

## Configuration Interfaces

### Tool Configuration

```typescript
interface ToolConfig {
    /** Enable/disable tool */
    enabled: boolean;
    
    /** Tool-specific settings */
    settings: Record<string, any>;
    
    /** Rate limiting */
    rate_limit?: {
        /** Max requests */
        max: number;
        /** Time window in seconds */
        window: number;
    };
}
```

### System Configuration

```typescript
interface SystemConfig {
    /** System name */
    name: string;
    
    /** Environment */
    environment: 'development' | 'production';
    
    /** Log level */
    log_level: 'debug' | 'info' | 'warn' | 'error';
    
    /** Tool configurations */
    tools: Record<string, ToolConfig>;
}
```

## Best Practices

1. Use TypeScript for all interfaces
2. Include JSDoc comments
3. Use strict typing
4. Keep interfaces focused
5. Use consistent naming
6. Document constraints
7. Version interfaces
8. Include examples

## See Also

- [Tool Development Guide](tools.md)
- [Best Practices](best-practices.md)
- [Testing Guide](../testing.md) 