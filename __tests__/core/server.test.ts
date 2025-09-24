import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import {
    type MockLiteMCPInstance,
    type Tool,
    createMockLiteMCPInstance,
    createMockServices,
    setupTestEnvironment,
    cleanupMocks
} from '../utils/test-utils';
import { resolve } from "path";
import { config } from "dotenv";
import { Tool as IndexTool } from "../../src/types/index.js";
import { tools as indexTools } from "../../src/tools/index.js";

// Load test environment variables
config({ path: resolve(process.cwd(), '.env.test') });

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
        addToolCalls = liteMcpInstance.addTool.mock.calls.map(call => call[0]);
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

    test('should register all required tools', () => {
        const toolNames = indexTools.map((tool: IndexTool) => tool.name);

        expect(toolNames).toContain('list_devices');
        expect(toolNames).toContain('control');
    });

    test('should configure tools with correct parameters', () => {
        const listDevicesTool = indexTools.find((tool: IndexTool) => tool.name === 'list_devices');
        expect(listDevicesTool).toBeDefined();
        expect(listDevicesTool?.description).toBe('List all available Home Assistant devices');

        const controlTool = indexTools.find((tool: IndexTool) => tool.name === 'control');
        expect(controlTool).toBeDefined();
        expect(controlTool?.description).toBe('Control Home Assistant devices and services');
    });
}); 