# Development Best Practices

This guide outlines the best practices for developing tools and features for the Home Assistant MCP.

## Code Style

### TypeScript

1. Use TypeScript for all new code
2. Enable strict mode
3. Use explicit types
4. Avoid `any` type
5. Use interfaces over types
6. Document with JSDoc comments

```typescript
/** 
 * Represents a device in the system.
 * @interface
 */
interface Device {
    /** Unique device identifier */
    id: string;
    
    /** Human-readable device name */
    name: string;
    
    /** Device state */
    state: DeviceState;
}
```

### Naming Conventions

1. Use PascalCase for:
   - Classes
   - Interfaces
   - Types
   - Enums

2. Use camelCase for:
   - Variables
   - Functions
   - Methods
   - Properties

3. Use UPPER_SNAKE_CASE for:
   - Constants
   - Enum values

```typescript
class DeviceManager {
    private readonly DEFAULT_TIMEOUT = 5000;
    
    async getDeviceState(deviceId: string): Promise<DeviceState> {
        // Implementation
    }
}
```

## Architecture

### SOLID Principles

1. Single Responsibility
   - Each class/module has one job
   - Split complex functionality

2. Open/Closed
   - Open for extension
   - Closed for modification

3. Liskov Substitution
   - Subtypes must be substitutable
   - Use interfaces properly

4. Interface Segregation
   - Keep interfaces focused
   - Split large interfaces

5. Dependency Inversion
   - Depend on abstractions
   - Use dependency injection

### Example

```typescript
// Bad
class DeviceManager {
    async getState() { /* ... */ }
    async setState() { /* ... */ }
    async sendNotification() { /* ... */ }  // Wrong responsibility
}

// Good
class DeviceManager {
    constructor(
        private notifier: NotificationService
    ) {}

    async getState() { /* ... */ }
    async setState() { /* ... */ }
}

class NotificationService {
    async send() { /* ... */ }
}
```

## Error Handling

### Best Practices

1. Use custom error classes
2. Include error codes
3. Provide meaningful messages
4. Include error context
5. Handle async errors
6. Log appropriately

```typescript
class DeviceError extends Error {
    constructor(
        message: string,
        public code: string,
        public context: Record<string, any>
    ) {
        super(message);
        this.name = 'DeviceError';
    }
}

try {
    await device.connect();
} catch (error) {
    throw new DeviceError(
        'Failed to connect to device',
        'DEVICE_CONNECTION_ERROR',
        { deviceId: device.id, attempt: 1 }
    );
}
```

## Testing

### Guidelines

1. Write unit tests first
2. Use meaningful descriptions
3. Test edge cases
4. Mock external dependencies
5. Keep tests focused
6. Use test fixtures

```typescript
describe('DeviceManager', () => {
    let manager: DeviceManager;
    let mockDevice: jest.Mocked<Device>;

    beforeEach(() => {
        mockDevice = {
            id: 'test_device',
            getState: jest.fn()
        };
        manager = new DeviceManager(mockDevice);
    });

    it('should get device state', async () => {
        mockDevice.getState.mockResolvedValue('on');
        const state = await manager.getDeviceState();
        expect(state).toBe('on');
    });
});
```

## Performance

### Optimization

1. Use caching
2. Implement pagination
3. Optimize database queries
4. Use connection pooling
5. Implement rate limiting
6. Batch operations

```typescript
class DeviceCache {
    private cache = new Map<string, CacheEntry>();
    private readonly TTL = 60000;  // 1 minute

    async getDevice(id: string): Promise<Device> {
        const cached = this.cache.get(id);
        if (cached && Date.now() - cached.timestamp < this.TTL) {
            return cached.device;
        }
        
        const device = await this.fetchDevice(id);
        this.cache.set(id, {
            device,
            timestamp: Date.now()
        });
        
        return device;
    }
}
```

## Security

### Guidelines

1. Validate all input
2. Use parameterized queries
3. Implement rate limiting
4. Use proper authentication
5. Follow OWASP guidelines
6. Sanitize output

```typescript
class InputValidator {
    static validateDeviceId(id: string): boolean {
        return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
    }

    static sanitizeOutput(data: any): any {
        // Implement output sanitization
        return data;
    }
}
```

## Documentation

### Standards

1. Use JSDoc comments
2. Document interfaces
3. Include examples
4. Document errors
5. Keep docs updated
6. Use markdown

```typescript
/**
 * Manages device operations.
 * @class
 */
class DeviceManager {
    /**
     * Gets the current state of a device.
     * @param {string} deviceId - The device identifier.
     * @returns {Promise<DeviceState>} The current device state.
     * @throws {DeviceError} If device is not found or unavailable.
     * @example
     * const state = await deviceManager.getDeviceState('living_room_light');
     */
    async getDeviceState(deviceId: string): Promise<DeviceState> {
        // Implementation
    }
}
```

## Logging

### Best Practices

1. Use appropriate levels
2. Include context
3. Structure log data
4. Handle sensitive data
5. Implement rotation
6. Use correlation IDs

```typescript
class Logger {
    info(message: string, context: Record<string, any>) {
        console.log(JSON.stringify({
            level: 'info',
            message,
            context,
            timestamp: new Date().toISOString(),
            correlationId: context.correlationId
        }));
    }
}
```

## Version Control

### Guidelines

1. Use meaningful commits
2. Follow branching strategy
3. Write good PR descriptions
4. Review code thoroughly
5. Keep changes focused
6. Use conventional commits

```bash
# Good commit messages
git commit -m "feat(device): add support for zigbee devices"
git commit -m "fix(api): handle timeout errors properly"
```

## See Also

- [Tool Development Guide](tools.md)
- [Interface Documentation](interfaces.md)
- [Testing Guide](../testing.md) 