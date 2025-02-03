import { config } from "dotenv";
import path from "path";
import { TEST_CONFIG } from "../config/__tests__/test.config";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  test,
} from "bun:test";

// Load test environment variables
config({ path: path.resolve(process.cwd(), ".env.test") });

// Global test setup
beforeAll(() => {
  // Set required environment variables
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = TEST_CONFIG.TEST_JWT_SECRET;
  process.env.TEST_TOKEN = TEST_CONFIG.TEST_TOKEN;

  // Configure console output for tests
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Suppress console output during tests unless explicitly enabled
  if (!process.env.DEBUG) {
    console.error = mock(() => {});
    console.warn = mock(() => {});
    console.log = mock(() => {});
  }

  // Store original console methods for cleanup
  (global as any).__ORIGINAL_CONSOLE__ = {
    error: originalConsoleError,
    warn: originalConsoleWarn,
    log: originalConsoleLog,
  };
});

// Global test teardown
afterAll(() => {
  // Restore original console methods
  const originalConsole = (global as any).__ORIGINAL_CONSOLE__;
  if (originalConsole) {
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.log = originalConsole.log;
    delete (global as any).__ORIGINAL_CONSOLE__;
  }
});

// Reset mocks between tests
beforeEach(() => {
  // Clear all mock function calls
  const mockFns = Object.values(mock).filter(
    (value) => typeof value === "function",
  );
  mockFns.forEach((mockFn) => {
    if (mockFn.mock) {
      mockFn.mock.calls = [];
      mockFn.mock.results = [];
      mockFn.mock.instances = [];
      mockFn.mock.lastCall = undefined;
    }
  });
});

// Custom test environment setup
const setupTestEnvironment = () => {
  return {
    // Mock WebSocket for SSE tests
    mockWebSocket: () => {
      const mockWs = {
        on: mock(() => {}),
        send: mock(() => {}),
        close: mock(() => {}),
      };
      return mockWs;
    },

    // Mock HTTP response for API tests
    mockResponse: () => {
      const res: any = {};
      res.status = mock(() => res);
      res.json = mock(() => res);
      res.send = mock(() => res);
      res.end = mock(() => res);
      res.setHeader = mock(() => res);
      res.writeHead = mock(() => res);
      res.write = mock(() => true);
      res.removeHeader = mock(() => res);
      return res;
    },

    // Mock HTTP request for API tests
    mockRequest: (overrides = {}) => {
      return {
        headers: { "content-type": "application/json" },
        body: {},
        query: {},
        params: {},
        ip: TEST_CONFIG.TEST_CLIENT_IP,
        method: "GET",
        path: "/api/test",
        is: mock((type: string) => type === "application/json"),
        ...overrides,
      };
    },

    // Create test client for SSE tests
    createTestClient: (id: string = "test-client") => ({
      id,
      ip: TEST_CONFIG.TEST_CLIENT_IP,
      connectedAt: new Date(),
      send: mock(() => {}),
      rateLimit: {
        count: 0,
        lastReset: Date.now(),
      },
      connectionTime: Date.now(),
    }),

    // Create test event for SSE tests
    createTestEvent: (type: string = "test_event", data: any = {}) => ({
      event_type: type,
      data,
      origin: "test",
      time_fired: new Date().toISOString(),
      context: { id: "test" },
    }),

    // Create test entity for Home Assistant tests
    createTestEntity: (
      entityId: string = "test.entity",
      state: string = "on",
    ) => ({
      entity_id: entityId,
      state,
      attributes: {},
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }),

    // Helper to wait for async operations
    wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
};

// Export test utilities
export const testUtils = setupTestEnvironment();

// Export Bun test utilities
export { beforeAll, afterAll, beforeEach, describe, expect, it, mock, test };

// Make test utilities available globally
(global as any).testUtils = testUtils;
(global as any).describe = describe;
(global as any).it = it;
(global as any).test = test;
(global as any).expect = expect;
(global as any).beforeAll = beforeAll;
(global as any).afterAll = afterAll;
(global as any).beforeEach = beforeEach;
(global as any).mock = mock;
