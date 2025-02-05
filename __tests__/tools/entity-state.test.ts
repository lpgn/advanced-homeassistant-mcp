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

describe('Entity State Tools', () => {
    let liteMcpInstance: MockLiteMCPInstance;
    let addToolCalls: Tool[];
    let mocks: ReturnType<typeof setupTestEnvironment>;

    const mockEntityState = {
        entity_id: 'light.living_room',
        state: 'on',
        attributes: {
            brightness: 255,
            color_temp: 400,
            friendly_name: 'Living Room Light'
        },
        last_changed: '2024-03-20T12:00:00Z',
        last_updated: '2024-03-20T12:00:00Z',
        context: {
            id: 'test_context_id',
            parent_id: null,
            user_id: null
        }
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

    describe('entity_state tool', () => {
        test('should successfully get entity state', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse(mockEntityState)));
            globalThis.fetch = mocks.mockFetch;

            const entityStateTool = addToolCalls.find(tool => tool.name === 'entity_state');
            expect(entityStateTool).toBeDefined();

            if (!entityStateTool) {
                throw new Error('entity_state tool not found');
            }

            const result = await entityStateTool.execute({
                entity_id: 'light.living_room'
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.state).toBe('on');
            expect(result.attributes).toEqual(mockEntityState.attributes);

            // Verify the fetch call
            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/states/light.living_room`);
            expect(options).toEqual({
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
        });

        test('should handle entity not found', async () => {
            // Setup error response
            mocks.mockFetch = mock(() => Promise.reject(new Error('Entity not found')));
            globalThis.fetch = mocks.mockFetch;

            const entityStateTool = addToolCalls.find(tool => tool.name === 'entity_state');
            expect(entityStateTool).toBeDefined();

            if (!entityStateTool) {
                throw new Error('entity_state tool not found');
            }

            const result = await entityStateTool.execute({
                entity_id: 'light.non_existent'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Failed to get entity state: Entity not found');
        });

        test('should require entity_id', async () => {
            const entityStateTool = addToolCalls.find(tool => tool.name === 'entity_state');
            expect(entityStateTool).toBeDefined();

            if (!entityStateTool) {
                throw new Error('entity_state tool not found');
            }

            const result = await entityStateTool.execute({}) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Entity ID is required');
        });

        test('should handle invalid entity_id format', async () => {
            const entityStateTool = addToolCalls.find(tool => tool.name === 'entity_state');
            expect(entityStateTool).toBeDefined();

            if (!entityStateTool) {
                throw new Error('entity_state tool not found');
            }

            const result = await entityStateTool.execute({
                entity_id: 'invalid_entity_id'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid entity ID format: invalid_entity_id');
        });

        test('should successfully get multiple entity states', async () => {
            // Setup response
            const mockStates = [
                { ...mockEntityState },
                {
                    ...mockEntityState,
                    entity_id: 'light.kitchen',
                    attributes: { ...mockEntityState.attributes, friendly_name: 'Kitchen Light' }
                }
            ];
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse(mockStates)));
            globalThis.fetch = mocks.mockFetch;

            const entityStateTool = addToolCalls.find(tool => tool.name === 'entity_state');
            expect(entityStateTool).toBeDefined();

            if (!entityStateTool) {
                throw new Error('entity_state tool not found');
            }

            const result = await entityStateTool.execute({
                entity_id: ['light.living_room', 'light.kitchen']
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(Array.isArray(result.states)).toBe(true);
            expect(result.states).toHaveLength(2);
            expect(result.states[0].entity_id).toBe('light.living_room');
            expect(result.states[1].entity_id).toBe('light.kitchen');

            // Verify the fetch call
            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/states`);
            expect(options).toEqual({
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
        });
    });
}); 