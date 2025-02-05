import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import {
    type MockLiteMCPInstance,
    type Tool,
    type TestResponse,
    TEST_CONFIG,
    createMockLiteMCPInstance,
    createMockServices,
    setupTestEnvironment,
    cleanupMocks,
    createMockResponse,
    getMockCallArgs
} from '../utils/test-utils';

describe('Device Control Tools', () => {
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

    describe('list_devices tool', () => {
        test('should successfully list devices', async () => {
            const mockDevices = [
                {
                    entity_id: 'light.living_room',
                    state: 'on',
                    attributes: { brightness: 255 }
                },
                {
                    entity_id: 'climate.bedroom',
                    state: 'heat',
                    attributes: { temperature: 22 }
                }
            ];

            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse(mockDevices)));
            globalThis.fetch = mocks.mockFetch;

            const listDevicesTool = addToolCalls.find(tool => tool.name === 'list_devices');
            expect(listDevicesTool).toBeDefined();

            if (!listDevicesTool) {
                throw new Error('list_devices tool not found');
            }

            const result = await listDevicesTool.execute({}) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.devices).toEqual({
                light: [{
                    entity_id: 'light.living_room',
                    state: 'on',
                    attributes: { brightness: 255 }
                }],
                climate: [{
                    entity_id: 'climate.bedroom',
                    state: 'heat',
                    attributes: { temperature: 22 }
                }]
            });
        });

        test('should handle fetch errors', async () => {
            // Setup error response
            mocks.mockFetch = mock(() => Promise.reject(new Error('Network error')));
            globalThis.fetch = mocks.mockFetch;

            const listDevicesTool = addToolCalls.find(tool => tool.name === 'list_devices');
            expect(listDevicesTool).toBeDefined();

            if (!listDevicesTool) {
                throw new Error('list_devices tool not found');
            }

            const result = await listDevicesTool.execute({}) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Network error');
        });
    });

    describe('control tool', () => {
        test('should successfully control a light device', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({})));
            globalThis.fetch = mocks.mockFetch;

            const controlTool = addToolCalls.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            const result = await controlTool.execute({
                command: 'turn_on',
                entity_id: 'light.living_room',
                brightness: 255
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully executed turn_on for light.living_room');

            // Verify the fetch call
            const calls = mocks.mockFetch.mock.calls;
            expect(calls.length).toBeGreaterThan(0);

            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/light/turn_on`);
            expect(options).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entity_id: 'light.living_room',
                    brightness: 255
                })
            });
        });

        test('should handle unsupported domains', async () => {
            const controlTool = addToolCalls.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            const result = await controlTool.execute({
                command: 'turn_on',
                entity_id: 'unsupported.device'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Unsupported domain: unsupported');
        });

        test('should handle service call errors', async () => {
            // Setup error response
            mocks.mockFetch = mock(() => Promise.resolve(new Response(null, {
                status: 503,
                statusText: 'Service unavailable'
            })));
            globalThis.fetch = mocks.mockFetch;

            const controlTool = addToolCalls.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            const result = await controlTool.execute({
                command: 'turn_on',
                entity_id: 'light.living_room'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to execute turn_on for light.living_room');
        });

        test('should handle climate device controls', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({})));
            globalThis.fetch = mocks.mockFetch;

            const controlTool = addToolCalls.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            const result = await controlTool.execute({
                command: 'set_temperature',
                entity_id: 'climate.bedroom',
                temperature: 22,
                target_temp_high: 24,
                target_temp_low: 20
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully executed set_temperature for climate.bedroom');

            // Verify the fetch call
            const calls = mocks.mockFetch.mock.calls;
            expect(calls.length).toBeGreaterThan(0);

            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/climate/set_temperature`);
            expect(options).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entity_id: 'climate.bedroom',
                    temperature: 22,
                    target_temp_high: 24,
                    target_temp_low: 20
                })
            });
        });
    });

    describe('device_control tool', () => {
        test('should successfully control a device', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({ success: true })));
            globalThis.fetch = mocks.mockFetch;

            const deviceControlTool = addToolCalls.find(tool => tool.name === 'device_control');
            expect(deviceControlTool).toBeDefined();

            if (!deviceControlTool) {
                throw new Error('device_control tool not found');
            }

            const result = await deviceControlTool.execute({
                entity_id: 'light.living_room',
                service: 'turn_on',
                data: {
                    brightness: 255,
                    color_temp: 400
                }
            }) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully controlled device light.living_room');

            // Verify the fetch call
            type FetchArgs = [url: string, init: RequestInit];
            const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
            expect(args).toBeDefined();

            if (!args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = args;
            expect(urlStr).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/light/turn_on`);
            expect(options).toEqual({
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    entity_id: 'light.living_room',
                    brightness: 255,
                    color_temp: 400
                })
            });
        });

        test('should handle device control failure', async () => {
            // Setup error response
            mocks.mockFetch = mock(() => Promise.reject(new Error('Failed to control device')));
            globalThis.fetch = mocks.mockFetch;

            const deviceControlTool = addToolCalls.find(tool => tool.name === 'device_control');
            expect(deviceControlTool).toBeDefined();

            if (!deviceControlTool) {
                throw new Error('device_control tool not found');
            }

            const result = await deviceControlTool.execute({
                entity_id: 'light.living_room',
                service: 'turn_on'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Failed to control device: Failed to control device');
        });

        test('should require entity_id', async () => {
            const deviceControlTool = addToolCalls.find(tool => tool.name === 'device_control');
            expect(deviceControlTool).toBeDefined();

            if (!deviceControlTool) {
                throw new Error('device_control tool not found');
            }

            const result = await deviceControlTool.execute({
                service: 'turn_on'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Entity ID is required');
        });

        test('should require service', async () => {
            const deviceControlTool = addToolCalls.find(tool => tool.name === 'device_control');
            expect(deviceControlTool).toBeDefined();

            if (!deviceControlTool) {
                throw new Error('device_control tool not found');
            }

            const result = await deviceControlTool.execute({
                entity_id: 'light.living_room'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Service is required');
        });

        test('should handle invalid service domain', async () => {
            const deviceControlTool = addToolCalls.find(tool => tool.name === 'device_control');
            expect(deviceControlTool).toBeDefined();

            if (!deviceControlTool) {
                throw new Error('device_control tool not found');
            }

            const result = await deviceControlTool.execute({
                entity_id: 'light.living_room',
                service: 'invalid_domain.turn_on'
            }) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid service domain: invalid_domain');
        });
    });
}); 