import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import {
    type MockLiteMCPInstance,
    type Tool,
    createMockLiteMCPInstance,
    createMockServices,
    setupTestEnvironment,
    cleanupMocks
} from '../utils/test-utils';

describe('Home Assistant MCP Server', () => {
    let liteMcpInstance: MockLiteMCPInstance;
    let addToolCalls: Tool[];
    let mocks: ReturnType<typeof setupTestEnvironment>;

    beforeEach(async () => {
        // Setup test environment
        mocks = setupTestEnvironment();
        liteMcpInstance = createMockLiteMCPInstance();

        // Import the module which will execute the main function
        await import('../../src/index.js');

        // Get the mock instance and tool calls
        addToolCalls = liteMcpInstance.addTool.mock.calls.map(call => call.args[0]);
    });

    afterEach(() => {
        cleanupMocks({ liteMcpInstance, ...mocks });
    });

    test('should connect to Home Assistant', async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        // Verify connection
        expect(mocks.mockFetch.mock.calls.length).toBeGreaterThan(0);
        expect(liteMcpInstance.start.mock.calls.length).toBeGreaterThan(0);
    });

    test('should handle connection errors', async () => {
        // Setup error response
        mocks.mockFetch = mock(() => Promise.reject(new Error('Connection failed')));
        globalThis.fetch = mocks.mockFetch;

        // Import module again with error mock
        await import('../../src/index.js');

        // Verify error handling
        expect(mocks.mockFetch.mock.calls.length).toBeGreaterThan(0);
        expect(liteMcpInstance.start.mock.calls.length).toBe(0);
    });

    describe('Tool Registration', () => {
        test('should register all required tools', () => {
            const toolNames = addToolCalls.map(tool => tool.name);

            expect(toolNames).toContain('list_devices');
            expect(toolNames).toContain('control');
            expect(toolNames).toContain('get_history');
            expect(toolNames).toContain('scene');
            expect(toolNames).toContain('notify');
            expect(toolNames).toContain('automation');
            expect(toolNames).toContain('addon');
            expect(toolNames).toContain('package');
            expect(toolNames).toContain('automation_config');
        });

        test('should configure tools with correct parameters', () => {
            const listDevicesTool = addToolCalls.find(tool => tool.name === 'list_devices');
            expect(listDevicesTool).toBeDefined();
            expect(listDevicesTool?.parameters).toBeDefined();

            const controlTool = addToolCalls.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();
            expect(controlTool?.parameters).toBeDefined();
        });
    });
}); 