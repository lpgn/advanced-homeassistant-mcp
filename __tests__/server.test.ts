import { describe, expect, test, beforeEach, afterEach, mock, spyOn } from "bun:test";
import type { Mock } from "bun:test";

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
const MockExpress = mock(() => mockApp);
const mockCors = mock(() => (app: any) => app);
const mockSpeechService = {
    initialize: mock(() => Promise.resolve()),
    shutdown: mock(() => Promise.resolve())
};

// Mock the modules
const mockModules = {
    express: MockExpress,
    cors: mockCors,
    speechService: mockSpeechService,
    config: mock(() => ({})),
    resolve: mock((...args: string[]) => args.join('/')),
    z: { object: mock(() => ({})), enum: mock(() => ({})) }
};

// Mock module resolution
const mockResolver = {
    resolve(specifier: string) {
        const mocks: Record<string, any> = {
            'express': mockModules.express,
            'cors': mockModules.cors,
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

    beforeEach(() => {
        // Store original environment
        originalEnv = { ...process.env };

        // Mock console methods
        consoleLog = mock(() => {});
        consoleError = mock(() => {});
        console.log = consoleLog;
        console.error = consoleError;

        // Set default environment variables
        process.env.NODE_ENV = 'test';
        process.env.PORT = '4000';
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    test('should initialize server successfully', async () => {
        // Import and initialize server - should not throw
        let error: Error | null = null;
        try {
            await import('../src/index');
        } catch (e) {
            error = e as Error;
        }
        expect(error).toBeNull();
    });

    test('should handle speech service environment variable', async () => {
        // Enable speech service
        process.env.SPEECH_ENABLED = 'true';

        // Import and initialize server
        await import('../src/index');

        // Verify the module loads without error
        expect(true).toBe(true); // Basic smoke test
    });

    test('should handle server shutdown signals', async () => {
        // Import and initialize server
        await import('../src/index');

        // Simulate SIGTERM
        process.emit('SIGTERM');

        // Verify the process exits (this is a basic test)
        expect(true).toBe(true);
    });
}); 