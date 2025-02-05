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

describe('Automation Tools', () => {
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

    describe('automation tool', () => {
        const mockAutomations = [
            {
                entity_id: 'automation.morning_routine',
                state: 'on',
                attributes: {
                    friendly_name: 'Morning Routine',
                    last_triggered: '2024-01-01T07:00:00Z'
                }
            },
            {
                entity_id: 'automation.night_mode',
                state: 'off',
                attributes: {
                    friendly_name: 'Night Mode',
                    last_triggered: '2024-01-01T22:00:00Z'
                }
            }
        ];

        test('should successfully list automations', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse(mockAutomations)));
            globalThis.fetch = mocks.mockFetch;

            const automationTool = addToolCalls.find(tool => tool.name === 'automation');
            expect(automationTool).toBeDefined();

            if (!automationTool) {
                throw new Error('automation tool not found');
            }

            const result = await automationTool.execute({
                action: 'list'
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.automations).toEqual([
                {
                    entity_id: 'automation.morning_routine',
                    name: 'Morning Routine',
                    state: 'on',
                    last_triggered: '2024-01-01T07:00:00Z'
                },
                {
                    entity_id: 'automation.night_mode',
                    name: 'Night Mode',
                    state: 'off',
                    last_triggered: '2024-01-01T22:00:00Z'
                }
            ]);
        });

        test('should successfully toggle an automation', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({})));
            globalThis.fetch = mocks.mockFetch;

            const automationTool = addToolCalls.find(tool => tool.name === 'automation');
            expect(automationTool).toBeDefined();

            if (!automationTool) {
                throw new Error('automation tool not found');
            }

            const result = await automationTool.execute({
                action: 'toggle',
                automation_id: 'automation.morning_routine'
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully toggled automation automation.morning_routine');

            // Verify the fetch call
            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/automation/toggle`);
            expect(options).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entity_id: 'automation.morning_routine'
                })
            });
        });

        test('should successfully trigger an automation', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({})));
            globalThis.fetch = mocks.mockFetch;

            const automationTool = addToolCalls.find(tool => tool.name === 'automation');
            expect(automationTool).toBeDefined();

            if (!automationTool) {
                throw new Error('automation tool not found');
            }

            const result = await automationTool.execute({
                action: 'trigger',
                automation_id: 'automation.morning_routine'
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully triggered automation automation.morning_routine');

            // Verify the fetch call
            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/automation/trigger`);
            expect(options).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entity_id: 'automation.morning_routine'
                })
            });
        });

        test('should require automation_id for toggle and trigger actions', async () => {
            const automationTool = addToolCalls.find(tool => tool.name === 'automation');
            expect(automationTool).toBeDefined();

            if (!automationTool) {
                throw new Error('automation tool not found');
            }

            const result = await automationTool.execute({
                action: 'toggle'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Automation ID is required for toggle and trigger actions');
        });
    });
}); 