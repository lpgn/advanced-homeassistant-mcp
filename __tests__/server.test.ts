import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import type { Mock } from "bun:test";
import type { Express, Application } from 'express';
import type { Logger } from 'winston';

// Types for our mocks
interface MockApp {
    use: Mock<() => void>;
    listen: Mock<(port: number, callback: () => void) => { close: Mock<() => void> }>;
}

interface MockLiteMCPInstance {
    addTool: Mock<() => void>;
    start: Mock<() => Promise<void>>;
}

type MockLogger = {
    info: Mock<(message: string) => void>;
    error: Mock<(message: string) => void>;
    debug: Mock<(message: string) => void>;
};

// Mock express
const mockApp: MockApp = {
    use: mock(() => undefined),
    listen: mock((port: number, callback: () => void) => {
        callback();
        return { close: mock(() => undefined) };
    })
};
const mockExpress = mock(() => mockApp);

// Mock LiteMCP instance
const mockLiteMCPInstance: MockLiteMCPInstance = {
    addTool: mock(() => undefined),
    start: mock(() => Promise.resolve())
};
const mockLiteMCP = mock((name: string, version: string) => mockLiteMCPInstance);

// Mock logger
const mockLogger: MockLogger = {
    info: mock((message: string) => undefined),
    error: mock((message: string) => undefined),
    debug: mock((message: string) => undefined)
};

describe('Server Initialization', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        // Store original environment
        originalEnv = { ...process.env };

        // Setup mocks
        (globalThis as any).express = mockExpress;
        (globalThis as any).LiteMCP = mockLiteMCP;
        (globalThis as any).logger = mockLogger;

        // Reset all mocks
        mockApp.use.mockReset();
        mockApp.listen.mockReset();
        mockLogger.info.mockReset();
        mockLogger.error.mockReset();
        mockLogger.debug.mockReset();
        mockLiteMCP.mockReset();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;

        // Clean up mocks
        delete (globalThis as any).express;
        delete (globalThis as any).LiteMCP;
        delete (globalThis as any).logger;
    });

    test('should start Express server when not in Claude mode', async () => {
        // Set OpenAI mode
        process.env.PROCESSOR_TYPE = 'openai';

        // Import the main module
        await import('../src/index.js');

        // Verify Express server was initialized
        expect(mockExpress.mock.calls.length).toBeGreaterThan(0);
        expect(mockApp.use.mock.calls.length).toBeGreaterThan(0);
        expect(mockApp.listen.mock.calls.length).toBeGreaterThan(0);

        const infoMessages = mockLogger.info.mock.calls.map(([msg]) => msg);
        expect(infoMessages.some(msg => msg.includes('Server is running on port'))).toBe(true);
    });

    test('should not start Express server in Claude mode', async () => {
        // Set Claude mode
        process.env.PROCESSOR_TYPE = 'claude';

        // Import the main module
        await import('../src/index.js');

        // Verify Express server was not initialized
        expect(mockExpress.mock.calls.length).toBe(0);
        expect(mockApp.use.mock.calls.length).toBe(0);
        expect(mockApp.listen.mock.calls.length).toBe(0);

        const infoMessages = mockLogger.info.mock.calls.map(([msg]) => msg);
        expect(infoMessages).toContain('Running in Claude mode - Express server disabled');
    });

    test('should initialize LiteMCP in both modes', async () => {
        // Test OpenAI mode
        process.env.PROCESSOR_TYPE = 'openai';
        await import('../src/index.js');

        expect(mockLiteMCP.mock.calls.length).toBeGreaterThan(0);
        const [name, version] = mockLiteMCP.mock.calls[0] ?? [];
        expect(name).toBe('home-assistant');
        expect(typeof version).toBe('string');

        // Reset for next test
        mockLiteMCP.mockReset();

        // Test Claude mode
        process.env.PROCESSOR_TYPE = 'claude';
        await import('../src/index.js');

        expect(mockLiteMCP.mock.calls.length).toBeGreaterThan(0);
        const [name2, version2] = mockLiteMCP.mock.calls[0] ?? [];
        expect(name2).toBe('home-assistant');
        expect(typeof version2).toBe('string');
    });

    test('should handle missing PROCESSOR_TYPE (default to Express server)', async () => {
        // Remove PROCESSOR_TYPE
        delete process.env.PROCESSOR_TYPE;

        // Import the main module
        await import('../src/index.js');

        // Verify Express server was initialized (default behavior)
        expect(mockExpress.mock.calls.length).toBeGreaterThan(0);
        expect(mockApp.use.mock.calls.length).toBeGreaterThan(0);
        expect(mockApp.listen.mock.calls.length).toBeGreaterThan(0);

        const infoMessages = mockLogger.info.mock.calls.map(([msg]) => msg);
        expect(infoMessages.some(msg => msg.includes('Server is running on port'))).toBe(true);
    });
}); 