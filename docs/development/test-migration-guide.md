# Migrating Tests from Jest to Bun

This guide provides instructions for migrating test files from Jest to Bun's test framework.

## Table of Contents
- [Basic Setup](#basic-setup)
- [Import Changes](#import-changes)
- [API Changes](#api-changes)
- [Mocking](#mocking)
- [Common Patterns](#common-patterns)
- [Examples](#examples)

## Basic Setup

1. Remove Jest-related dependencies from `package.json`:
```json
{
  "devDependencies": {
    "@jest/globals": "...",
    "jest": "...",
    "ts-jest": "..."
  }
}
```

2. Remove Jest configuration files:
- `jest.config.js`
- `jest.setup.js`

3. Update test scripts in `package.json`:
```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

## Import Changes

### Before (Jest):
```typescript
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
```

### After (Bun):
```typescript
import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import type { Mock } from "bun:test";
```

Note: `it` is replaced with `test` in Bun.

## API Changes

### Test Structure
```typescript
// Jest
describe('Suite', () => {
  it('should do something', () => {
    // test
  });
});

// Bun
describe('Suite', () => {
  test('should do something', () => {
    // test
  });
});
```

### Assertions
Most Jest assertions work the same in Bun:

```typescript
// These work the same in both:
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(array).toContain(item);
expect(value).toBeInstanceOf(Class);
expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledWith(...args);
```

## Mocking

### Function Mocking

#### Before (Jest):
```typescript
const mockFn = jest.fn();
mockFn.mockImplementation(() => 'result');
mockFn.mockResolvedValue('result');
mockFn.mockRejectedValue(new Error());
```

#### After (Bun):
```typescript
const mockFn = mock(() => 'result');
const mockAsyncFn = mock(() => Promise.resolve('result'));
const mockErrorFn = mock(() => Promise.reject(new Error()));
```

### Module Mocking

#### Before (Jest):
```typescript
jest.mock('module-name', () => ({
  default: jest.fn(),
  namedExport: jest.fn()
}));
```

#### After (Bun):
```typescript
// Option 1: Using vi.mock (if available)
vi.mock('module-name', () => ({
  default: mock(() => {}),
  namedExport: mock(() => {})
}));

// Option 2: Using dynamic imports
const mockModule = {
  default: mock(() => {}),
  namedExport: mock(() => {})
};
```

### Mock Reset/Clear

#### Before (Jest):
```typescript
jest.clearAllMocks();
mockFn.mockClear();
jest.resetModules();
```

#### After (Bun):
```typescript
mockFn.mockReset();
// or for specific calls
mockFn.mock.calls = [];
```

### Spy on Methods

#### Before (Jest):
```typescript
jest.spyOn(object, 'method');
```

#### After (Bun):
```typescript
const spy = mock(((...args) => object.method(...args)));
object.method = spy;
```

## Common Patterns

### Async Tests
```typescript
// Works the same in both Jest and Bun:
test('async test', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe(expected);
});
```

### Setup and Teardown
```typescript
describe('Suite', () => {
  beforeEach(() => {
    // setup
  });

  afterEach(() => {
    // cleanup
  });

  test('test', () => {
    // test
  });
});
```

### Mocking Fetch
```typescript
// Before (Jest)
global.fetch = jest.fn(() => Promise.resolve(new Response()));

// After (Bun)
const mockFetch = mock(() => Promise.resolve(new Response()));
global.fetch = mockFetch as unknown as typeof fetch;
```

### Mocking WebSocket
```typescript
// Create a MockWebSocket class implementing WebSocket interface
class MockWebSocket implements WebSocket {
  public static readonly CONNECTING = 0;
  public static readonly OPEN = 1;
  public static readonly CLOSING = 2;
  public static readonly CLOSED = 3;

  public readyState: 0 | 1 | 2 | 3 = MockWebSocket.OPEN;
  public addEventListener = mock(() => undefined);
  public removeEventListener = mock(() => undefined);
  public send = mock(() => undefined);
  public close = mock(() => undefined);
  // ... implement other required methods
}

// Use it in tests
global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
```

## Examples

### Basic Test
```typescript
import { describe, expect, test } from "bun:test";

describe('formatToolCall', () => {
  test('should format an object into the correct structure', () => {
    const testObj = { name: 'test', value: 123 };
    const result = formatToolCall(testObj);

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify(testObj, null, 2),
        isError: false
      }]
    });
  });
});
```

### Async Test with Mocking
```typescript
import { describe, expect, test, mock } from "bun:test";

describe('API Client', () => {
  test('should fetch data', async () => {
    const mockResponse = { data: 'test' };
    const mockFetch = mock(() => Promise.resolve(new Response(
      JSON.stringify(mockResponse),
      { status: 200, headers: new Headers() }
    )));
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await apiClient.getData();
    expect(result).toEqual(mockResponse);
  });
});
```

### Complex Mocking Example
```typescript
import { describe, expect, test, mock } from "bun:test";
import type { Mock } from "bun:test";

interface MockServices {
  light: {
    turn_on: Mock<() => Promise<{ success: boolean }>>;
    turn_off: Mock<() => Promise<{ success: boolean }>>;
  };
}

const mockServices: MockServices = {
  light: {
    turn_on: mock(() => Promise.resolve({ success: true })),
    turn_off: mock(() => Promise.resolve({ success: true }))
  }
};

describe('Home Assistant Service', () => {
  test('should control lights', async () => {
    const result = await mockServices.light.turn_on();
    expect(result.success).toBe(true);
  });
});
```

## Best Practices

1. Use TypeScript for better type safety in mocks
2. Keep mocks as simple as possible
3. Prefer interface-based mocks over concrete implementations
4. Use proper type assertions when necessary
5. Clean up mocks in `afterEach` blocks
6. Use descriptive test names
7. Group related tests using `describe` blocks

## Common Issues and Solutions

### Issue: Type Errors with Mocks
```typescript
// Solution: Use proper typing with Mock type
import type { Mock } from "bun:test";
const mockFn: Mock<() => string> = mock(() => "result");
```

### Issue: Global Object Mocking
```typescript
// Solution: Use type assertions carefully
global.someGlobal = mockImplementation as unknown as typeof someGlobal;
```

### Issue: Module Mocking
```typescript
// Solution: Use dynamic imports or vi.mock if available
const mockModule = {
  default: mock(() => mockImplementation)
};
``` 