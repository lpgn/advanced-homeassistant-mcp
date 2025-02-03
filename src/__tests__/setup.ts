import { config } from 'dotenv';
import path from 'path';
import { TEST_CONFIG } from '../config/__tests__/test.config';

// Load test environment variables
config({ path: path.resolve(process.cwd(), '.env.test') });

// Global test setup
beforeAll(() => {
    // Set required environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = TEST_CONFIG.TEST_JWT_SECRET;
    process.env.TEST_TOKEN = TEST_CONFIG.TEST_TOKEN;

    // Configure console output for tests
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    // Suppress console output during tests unless explicitly enabled
    if (!process.env.DEBUG) {
        console.error = jest.fn();
        console.warn = jest.fn();
        console.log = jest.fn();
    }

    // Store original console methods for cleanup
    (global as any).__ORIGINAL_CONSOLE__ = {
        error: originalConsoleError,
        warn: originalConsoleWarn,
        log: originalConsoleLog
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
    jest.resetModules();
    jest.clearAllMocks();
});

// Custom test environment setup
const setupTestEnvironment = () => {
    return {
        // Mock WebSocket for SSE tests
        mockWebSocket: () => {
            const mockWs = {
                on: jest.fn(),
                send: jest.fn(),
                close: jest.fn()
            };
            return mockWs;
        },

        // Mock HTTP response for API tests
        mockResponse: () => {
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            res.send = jest.fn().mockReturnValue(res);
            res.end = jest.fn().mockReturnValue(res);
            res.setHeader = jest.fn().mockReturnValue(res);
            res.writeHead = jest.fn().mockReturnValue(res);
            res.write = jest.fn().mockReturnValue(true);
            return res;
        },

        // Mock HTTP request for API tests
        mockRequest: (overrides = {}) => {
            return {
                headers: { 'content-type': 'application/json' },
                body: {},
                query: {},
                params: {},
                ip: TEST_CONFIG.TEST_CLIENT_IP,
                method: 'GET',
                path: '/api/test',
                is: jest.fn(type => type === 'application/json'),
                ...overrides
            };
        },

        // Create test client for SSE tests
        createTestClient: (id: string = 'test-client') => ({
            id,
            ip: TEST_CONFIG.TEST_CLIENT_IP,
            connectedAt: new Date(),
            send: jest.fn(),
            rateLimit: {
                count: 0,
                lastReset: Date.now()
            },
            connectionTime: Date.now()
        }),

        // Create test event for SSE tests
        createTestEvent: (type: string = 'test_event', data: any = {}) => ({
            event_type: type,
            data,
            origin: 'test',
            time_fired: new Date().toISOString(),
            context: { id: 'test' }
        }),

        // Create test entity for Home Assistant tests
        createTestEntity: (entityId: string = 'test.entity', state: string = 'on') => ({
            entity_id: entityId,
            state,
            attributes: {},
            last_changed: new Date().toISOString(),
            last_updated: new Date().toISOString()
        }),

        // Helper to wait for async operations
        wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    };
};

// Export test utilities
export const testUtils = setupTestEnvironment();

// Make test utilities available globally
(global as any).testUtils = testUtils; 