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

describe('Automation Configuration Tools', () => {
    let liteMcpInstance: MockLiteMCPInstance;
    let addToolCalls: Tool[];
    let mocks: ReturnType<typeof setupTestEnvironment>;

    const mockAutomationConfig = {
        alias: 'Test Automation',
        description: 'Test automation description',
        mode: 'single',
        trigger: [
            {
                platform: 'state',
                entity_id: 'binary_sensor.motion',
                to: 'on'
            }
        ],
        action: [
            {
                service: 'light.turn_on',
                target: {
                    entity_id: 'light.living_room'
                }
            }
        ]
    };

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

    describe('automation_config tool', () => {
        test('should successfully create an automation', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({
                automation_id: 'new_automation_1'
            })));
            globalThis.fetch = mocks.mockFetch;

            const automationConfigTool = addToolCalls.find(tool => tool.name === 'automation_config');
            expect(automationConfigTool).toBeDefined();

            if (!automationConfigTool) {
                throw new Error('automation_config tool not found');
            }

            const result = await automationConfigTool.execute({
                action: 'create',
                config: mockAutomationConfig
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully created automation');
            expect(result.automation_id).toBe('new_automation_1');

            // Verify the fetch call
            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/config/automation/config`);
            expect(options).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mockAutomationConfig)
            });
        });

        test('should successfully duplicate an automation', async () => {
            // Setup responses for get and create
            let callCount = 0;
            mocks.mockFetch = mock(() => {
                callCount++;
                return Promise.resolve(
                    callCount === 1
                        ? createMockResponse(mockAutomationConfig)
                        : createMockResponse({ automation_id: 'new_automation_2' })
                );
            });
            globalThis.fetch = mocks.mockFetch;

            const automationConfigTool = addToolCalls.find(tool => tool.name === 'automation_config');
            expect(automationConfigTool).toBeDefined();

            if (!automationConfigTool) {
                throw new Error('automation_config tool not found');
            }

            const result = await automationConfigTool.execute({
                action: 'duplicate',
                automation_id: 'automation.test'
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully duplicated automation automation.test');
            expect(result.new_automation_id).toBe('new_automation_2');

            // Verify both API calls
            type FetchArgs = [url: string, init: RequestInit];
            const calls = mocks.mockFetch.mock.calls;
            expect(calls.length).toBe(2);

            // Verify get call
            const getArgs = getMockCallArgs<FetchArgs>(mocks.mockFetch, 0);
            expect(getArgs).toBeDefined();
            if (!getArgs) throw new Error('No get call recorded');

            const [getUrl, getOptions] = getArgs;
            expect(getUrl).toBe(`${TEST_CONFIG.HASS_HOST}/api/config/automation/config/automation.test`);
            expect(getOptions).toEqual({
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            // Verify create call
            const createArgs = getMockCallArgs<FetchArgs>(mocks.mockFetch, 1);
            expect(createArgs).toBeDefined();
            if (!createArgs) throw new Error('No create call recorded');

            const [createUrl, createOptions] = createArgs;
            expect(createUrl).toBe(`${TEST_CONFIG.HASS_HOST}/api/config/automation/config`);
            expect(createOptions).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...mockAutomationConfig,
                    alias: 'Test Automation (Copy)'
                })
            });
        });

        test('should require config for create action', async () => {
            const automationConfigTool = addToolCalls.find(tool => tool.name === 'automation_config');
            expect(automationConfigTool).toBeDefined();

            if (!automationConfigTool) {
                throw new Error('automation_config tool not found');
            }

            const result = await automationConfigTool.execute({
                action: 'create'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Configuration is required for creating automation');
        });

        test('should require automation_id for update action', async () => {
            const automationConfigTool = addToolCalls.find(tool => tool.name === 'automation_config');
            expect(automationConfigTool).toBeDefined();

            if (!automationConfigTool) {
                throw new Error('automation_config tool not found');
            }

            const result = await automationConfigTool.execute({
                action: 'update',
                config: mockAutomationConfig
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Automation ID and configuration are required for updating automation');
        });
    });
}); 