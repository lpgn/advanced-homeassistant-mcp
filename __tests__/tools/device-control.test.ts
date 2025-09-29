import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import { tools } from '../../src/tools/index.js';
import {
    TEST_CONFIG,
    createMockResponse,
    getMockCallArgs
} from '../utils/test-utils';

describe('Device Control Tools', () => {
    let mocks: { mockFetch: ReturnType<typeof mock> };

    beforeEach(async () => {
        // Setup mock fetch
        mocks = {
            mockFetch: mock(() => Promise.resolve(createMockResponse({})))
        };
        globalThis.fetch = mocks.mockFetch;
        await Promise.resolve();
    });

    afterEach(() => {
        // Reset mocks
        globalThis.fetch = undefined;
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

            const listDevicesTool = tools.find(tool => tool.name === 'list_devices');
            expect(listDevicesTool).toBeDefined();

            if (!listDevicesTool) {
                throw new Error('list_devices tool not found');
            }

            const result = await listDevicesTool.execute({});

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

            const listDevicesTool = tools.find(tool => tool.name === 'list_devices');
            expect(listDevicesTool).toBeDefined();

            if (!listDevicesTool) {
                throw new Error('list_devices tool not found');
            }

            const result = await listDevicesTool.execute({});

            expect(result.success).toBe(false);
            expect(result.message).toBe('Network error');
        });
    });

    describe('control tool', () => {
        test('should successfully control a light device', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({})));
            globalThis.fetch = mocks.mockFetch;

            const controlTool = tools.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            const result = await controlTool.execute({
                command: 'turn_on',
                entity_id: 'light.living_room',
                brightness: 255
            });

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
            const controlTool = tools.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            const result = await controlTool.execute({
                command: 'turn_on',
                entity_id: 'unsupported.device'
            });

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

            const controlTool = tools.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            const result = await controlTool.execute({
                command: 'turn_on',
                entity_id: 'light.living_room'
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to execute turn_on for light.living_room');
        });

        test('should handle climate device controls', async () => {
            // Setup response
            mocks.mockFetch = mock(() => Promise.resolve(createMockResponse({})));
            globalThis.fetch = mocks.mockFetch;

            const controlTool = tools.find(tool => tool.name === 'control');
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
            });

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
}); 