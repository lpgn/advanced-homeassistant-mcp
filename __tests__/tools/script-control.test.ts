import { describe, expect, test } from "bun:test";
import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import {
    type MockLiteMCPInstance,
    type Tool,
    type TestResponse,
    TEST_CONFIG,
    createMockLiteMCPInstance,
    setupTestEnvironment,
    cleanupMocks,
    createMockResponse,
    getMockCallArgs
} from '../utils/test-utils';

describe('Script Control Tools', () => {
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

    describe('script_control tool', () => {
        test('should successfully execute a script', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({ success: true })));
            globalThis.fetch = mocks.mockFetch;

            const scriptControlTool = addToolCalls.find(tool => tool.name === 'script_control');
            expect(scriptControlTool).toBeDefined();

            if (!scriptControlTool) {
                throw new Error('script_control tool not found');
            }

            const result = await scriptControlTool.execute({
                script_id: 'script.welcome_home',
                action: 'start',
                variables: {
                    brightness: 100,
                    color_temp: 300
                }
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully executed script script.welcome_home');

            // Verify the fetch call
            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/script/turn_on`);
            expect(options).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entity_id: 'script.welcome_home',
                    variables: {
                        brightness: 100,
                        color_temp: 300
                    }
                })
            });
        });

        test('should successfully stop a script', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({ success: true })));
            globalThis.fetch = mocks.mockFetch;

            const scriptControlTool = addToolCalls.find(tool => tool.name === 'script_control');
            expect(scriptControlTool).toBeDefined();

            if (!scriptControlTool) {
                throw new Error('script_control tool not found');
            }

            const result = await scriptControlTool.execute({
                script_id: 'script.welcome_home',
                action: 'stop'
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully stopped script script.welcome_home');

            // Verify the fetch call
            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/script/turn_off`);
            expect(options).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entity_id: 'script.welcome_home'
                })
            });
        });

        test('should handle script execution failure', async () => {
            // Setup error response
            mocks.mockFetch = mock(() => Promise.reject(new Error('Failed to execute script')));
            globalThis.fetch = mocks.mockFetch;

            const scriptControlTool = addToolCalls.find(tool => tool.name === 'script_control');
            expect(scriptControlTool).toBeDefined();

            if (!scriptControlTool) {
                throw new Error('script_control tool not found');
            }

            const result = await scriptControlTool.execute({
                script_id: 'script.welcome_home',
                action: 'start'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Failed to execute script: Failed to execute script');
        });

        test('should require script_id', async () => {
            const scriptControlTool = addToolCalls.find(tool => tool.name === 'script_control');
            expect(scriptControlTool).toBeDefined();

            if (!scriptControlTool) {
                throw new Error('script_control tool not found');
            }

            const result = await scriptControlTool.execute({
                action: 'start'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Script ID is required');
        });

        test('should require action', async () => {
            const scriptControlTool = addToolCalls.find(tool => tool.name === 'script_control');
            expect(scriptControlTool).toBeDefined();

            if (!scriptControlTool) {
                throw new Error('script_control tool not found');
            }

            const result = await scriptControlTool.execute({
                script_id: 'script.welcome_home'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Action is required');
        });

        test('should handle invalid script_id format', async () => {
            const scriptControlTool = addToolCalls.find(tool => tool.name === 'script_control');
            expect(scriptControlTool).toBeDefined();

            if (!scriptControlTool) {
                throw new Error('script_control tool not found');
            }

            const result = await scriptControlTool.execute({
                script_id: 'invalid_script_id',
                action: 'start'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid script ID format: invalid_script_id');
        });

        test('should handle invalid action', async () => {
            const scriptControlTool = addToolCalls.find(tool => tool.name === 'script_control');
            expect(scriptControlTool).toBeDefined();

            if (!scriptControlTool) {
                throw new Error('script_control tool not found');
            }

            const result = await scriptControlTool.execute({
                script_id: 'script.welcome_home',
                action: 'invalid_action'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid action: invalid_action');
        });
    });
}); 