import { describe, expect, test, beforeEach, afterEach, mock, spyOn } from "bun:test";
import type { Mock } from "bun:test";
import type { Elysia } from "elysia";

// Create mock instances
const mockApp = {
    use: mock(() => mockApp),
    get: mock(() => mockApp),
    post: mock(() => mockApp),
    listen: mock((port: number, callback?: () => void) => {
        callback?.();
        return mockApp;
    })
};

// Create mock constructors
const MockElysia = mock(() => mockApp);
const mockCors = mock(() => (app: any) => app);
const mockSwagger = mock(() => (app: any) => app);
const mockSpeechService = {
    initialize: mock(() => Promise.resolve()),
    shutdown: mock(() => Promise.resolve())
};

// Mock the modules
const mockModules = {
    Elysia: MockElysia,
    cors: mockCors,
    swagger: mockSwagger,
    speechService: mockSpeechService,
    config: mock(() => ({})),
    resolve: mock((...args: string[]) => args.join('/')),
    z: { object: mock(() => ({})), enum: mock(() => ({})) }
};

// Mock module resolution
const mockResolver = {
    resolve(specifier: string) {
        const mocks: Record<string, any> = {
            'elysia': { Elysia: mockModules.Elysia },
            '@elysiajs/cors': { cors: mockModules.cors },
            '@elysiajs/swagger': { swagger: mockModules.swagger },
            '../speech/index.js': { speechService: mockModules.speechService },
            'dotenv': { config: mockModules.config },
            'path': { resolve: mockModules.resolve },
            'zod': { z: mockModules.z }
        };
        return mocks[specifier] || {};
    }
};

describe('Server Initialization', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let consoleLog: Mock<typeof console.log>;
    let consoleError: Mock<typeof console.error>;
    let originalResolve: any;

    beforeEach(() => {
        // Store original environment
        originalEnv = { ...process.env };

        // Mock console methods
        consoleLog = mock(() => { });
        consoleError = mock(() => { });
        console.log = consoleLog;
        console.error = consoleError;

        // Reset all mocks
        for (const key in mockModules) {
            const module = mockModules[key as keyof typeof mockModules];
            if (typeof module === 'object' && module !== null) {
                Object.values(module).forEach(value => {
                    if (typeof value === 'function' && 'mock' in value) {
                        (value as Mock<any>).mockReset();
                    }
                });
            } else if (typeof module === 'function' && 'mock' in module) {
                (module as Mock<any>).mockReset();
            }
        }

        // Set default environment variables
        process.env.NODE_ENV = 'test';
        process.env.PORT = '4000';

        // Setup module resolution mock
        originalResolve = (globalThis as any).Bun?.resolveSync;
        (globalThis as any).Bun = {
            ...(globalThis as any).Bun,
            resolveSync: (specifier: string) => mockResolver.resolve(specifier)
        };
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;

        // Restore module resolution
        if (originalResolve) {
            (globalThis as any).Bun.resolveSync = originalResolve;
        }
    });

    test('should initialize server with middleware', async () => {
        // Import and initialize server
        const mod = await import('../src/index');

        // Verify server initialization
        expect(MockElysia.mock.calls.length).toBe(1);
        expect(mockCors.mock.calls.length).toBe(1);
        expect(mockSwagger.mock.calls.length).toBe(1);

        // Verify console output
        const logCalls = consoleLog.mock.calls;
        expect(logCalls.some(call =>
            typeof call.args[0] === 'string' &&
            call.args[0].includes('Server is running on port')
        )).toBe(true);
    });

    test('should initialize speech service when enabled', async () => {
        // Enable speech service
        process.env.SPEECH_ENABLED = 'true';

        // Import and initialize server
        const mod = await import('../src/index');

        // Verify speech service initialization
        expect(mockSpeechService.initialize.mock.calls.length).toBe(1);
    });

    test('should handle server shutdown gracefully', async () => {
        // Enable speech service for shutdown test
        process.env.SPEECH_ENABLED = 'true';

        // Import and initialize server
        const mod = await import('../src/index');

        // Simulate SIGTERM
        process.emit('SIGTERM');

        // Verify shutdown behavior
        expect(mockSpeechService.shutdown.mock.calls.length).toBe(1);
        expect(consoleLog.mock.calls.some(call =>
            typeof call.args[0] === 'string' &&
            call.args[0].includes('Shutting down gracefully')
        )).toBe(true);
    });
}); 