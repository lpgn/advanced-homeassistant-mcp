import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import express from 'express';
import { LiteMCP } from 'litemcp';
import { logger } from '../src/utils/logger.js';

// Mock express
jest.mock('express', () => {
    const mockApp = {
        use: jest.fn(),
        listen: jest.fn((port: number, callback: () => void) => {
            callback();
            return { close: jest.fn() };
        })
    };
    return jest.fn(() => mockApp);
});

// Mock LiteMCP
jest.mock('litemcp', () => ({
    LiteMCP: jest.fn(() => ({
        addTool: jest.fn(),
        start: jest.fn().mockImplementation(async () => { })
    }))
}));

// Mock logger
jest.mock('../src/utils/logger.js', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));

describe('Server Initialization', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let mockApp: ReturnType<typeof express>;

    beforeEach(() => {
        // Store original environment
        originalEnv = { ...process.env };

        // Reset all mocks
        jest.clearAllMocks();

        // Get the mock express app
        mockApp = express();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;

        // Clear module cache to ensure fresh imports
        jest.resetModules();
    });

    it('should start Express server when not in Claude mode', async () => {
        // Set OpenAI mode
        process.env.PROCESSOR_TYPE = 'openai';

        // Import the main module
        await import('../src/index.js');

        // Verify Express server was initialized
        expect(express).toHaveBeenCalled();
        expect(mockApp.use).toHaveBeenCalled();
        expect(mockApp.listen).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Server is running on port'));
    });

    it('should not start Express server in Claude mode', async () => {
        // Set Claude mode
        process.env.PROCESSOR_TYPE = 'claude';

        // Import the main module
        await import('../src/index.js');

        // Verify Express server was not initialized
        expect(express).not.toHaveBeenCalled();
        expect(mockApp.use).not.toHaveBeenCalled();
        expect(mockApp.listen).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Running in Claude mode - Express server disabled');
    });

    it('should initialize LiteMCP in both modes', async () => {
        // Test OpenAI mode
        process.env.PROCESSOR_TYPE = 'openai';
        await import('../src/index.js');
        expect(LiteMCP).toHaveBeenCalledWith('home-assistant', expect.any(String));

        // Reset modules
        jest.resetModules();

        // Test Claude mode
        process.env.PROCESSOR_TYPE = 'claude';
        await import('../src/index.js');
        expect(LiteMCP).toHaveBeenCalledWith('home-assistant', expect.any(String));
    });

    it('should handle missing PROCESSOR_TYPE (default to Express server)', async () => {
        // Remove PROCESSOR_TYPE
        delete process.env.PROCESSOR_TYPE;

        // Import the main module
        await import('../src/index.js');

        // Verify Express server was initialized (default behavior)
        expect(express).toHaveBeenCalled();
        expect(mockApp.use).toHaveBeenCalled();
        expect(mockApp.listen).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Server is running on port'));
    });
}); 