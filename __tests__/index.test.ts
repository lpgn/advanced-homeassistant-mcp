import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import type { Mock } from "bun:test";
import type { WebSocket } from 'ws';
import type { LiteMCP } from 'litemcp';

// Extend the global scope
declare global {
    // eslint-disable-next-line no-var
    var mockResponse: Response;
}

// Types
interface Tool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (params: Record<string, unknown>) => Promise<unknown>;
}

interface MockLiteMCPInstance {
    addTool: Mock<(tool: Tool) => void>;
    start: Mock<() => Promise<void>>;
}

interface MockServices {
    light: {
        turn_on: Mock<() => Promise<{ success: boolean }>>;
        turn_off: Mock<() => Promise<{ success: boolean }>>;
    };
    climate: {
        set_temperature: Mock<() => Promise<{ success: boolean }>>;
    };
}

interface MockHassInstance {
    services: MockServices;
}

interface TestResponse {
    success: boolean;
    message?: string;
    devices?: Record<string, unknown>;
    history?: unknown[];
    scenes?: unknown[];
    automations?: unknown[];
    addons?: unknown[];
    packages?: unknown[];
    automation_id?: string;
    new_automation_id?: string;
}

// Test configuration
const TEST_CONFIG = {
    HASS_HOST: process.env.TEST_HASS_HOST || 'http://localhost:8123',
    HASS_TOKEN: process.env.TEST_HASS_TOKEN || 'test_token',
    HASS_SOCKET_URL: process.env.TEST_HASS_SOCKET_URL || 'ws://localhost:8123/api/websocket'
} as const;

// Setup test environment
Object.entries(TEST_CONFIG).forEach(([key, value]) => {
    process.env[key] = value;
});

// Mock instances
const mockLiteMCPInstance: MockLiteMCPInstance = {
    addTool: mock((tool: Tool) => undefined),
    start: mock(() => Promise.resolve())
};

const mockServices: MockServices = {
    light: {
        turn_on: mock(() => Promise.resolve({ success: true })),
        turn_off: mock(() => Promise.resolve({ success: true }))
    },
    climate: {
        set_temperature: mock(() => Promise.resolve({ success: true }))
    }
};

// Mock WebSocket
class MockWebSocket implements Partial<WebSocket> {
    public static readonly CONNECTING = 0;
    public static readonly OPEN = 1;
    public static readonly CLOSING = 2;
    public static readonly CLOSED = 3;

    public readyState: 0 | 1 | 2 | 3 = MockWebSocket.OPEN;
    public bufferedAmount = 0;
    public extensions = '';
    public protocol = '';
    public url = '';
    public binaryType: 'arraybuffer' | 'nodebuffer' | 'fragments' = 'arraybuffer';

    public onopen: ((event: any) => void) | null = null;
    public onerror: ((event: any) => void) | null = null;
    public onclose: ((event: any) => void) | null = null;
    public onmessage: ((event: any) => void) | null = null;

    public addEventListener = mock(() => undefined);
    public removeEventListener = mock(() => undefined);
    public send = mock(() => undefined);
    public close = mock(() => undefined);
    public ping = mock(() => undefined);
    public pong = mock(() => undefined);
    public terminate = mock(() => undefined);
    public dispatchEvent = mock(() => true);

    constructor(url: string | URL, protocols?: string | string[]) {
        this.url = url.toString();
        if (protocols) {
            this.protocol = Array.isArray(protocols) ? protocols[0] : protocols;
        }
    }
}

// Create fetch mock with implementation
let mockFetch = mock(() => {
    return Promise.resolve(new Response());
});

// Override globals
globalThis.fetch = mockFetch;
// Use type assertion to handle WebSocket compatibility
globalThis.WebSocket = MockWebSocket as any;

describe('Home Assistant MCP Server', () => {
    let mockHass: MockHassInstance;
    let liteMcpInstance: MockLiteMCPInstance;
    let addToolCalls: Tool[];

    beforeEach(async () => {
        mockHass = {
            services: mockServices
        };

        // Reset mocks
        mockLiteMCPInstance.addTool.mock.calls = [];
        mockLiteMCPInstance.start.mock.calls = [];

        // Setup default response
        mockFetch = mock(() => {
            return Promise.resolve(new Response(
                JSON.stringify({ state: 'connected' }),
                { status: 200 }
            ));
        });
        globalThis.fetch = mockFetch;

        // Import the module which will execute the main function
        await import('../src/index.js');

        // Get the mock instance
        liteMcpInstance = mockLiteMCPInstance;
        addToolCalls = mockLiteMCPInstance.addTool.mock.calls.map(call => call.args[0]);
    });

    afterEach(() => {
        // Clean up
        mockLiteMCPInstance.addTool.mock.calls = [];
        mockLiteMCPInstance.start.mock.calls = [];
        mockFetch = mock(() => Promise.resolve(new Response()));
        globalThis.fetch = mockFetch;
    });

    test('should connect to Home Assistant', async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        // Verify connection
        expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
        expect(mockLiteMCPInstance.start.mock.calls.length).toBeGreaterThan(0);
    });

    test('should handle connection errors', async () => {
        // Setup error response
        mockFetch = mock(() => Promise.reject(new Error('Connection failed')));
        globalThis.fetch = mockFetch;

        // Import module again with error mock
        await import('../src/index.js');

        // Verify error handling
        expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
        expect(mockLiteMCPInstance.start.mock.calls.length).toBe(0);
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

    describe('Tool Execution', () => {
        test('should execute list_devices tool', async () => {
            const listDevicesTool = addToolCalls.find(tool => tool.name === 'list_devices');
            expect(listDevicesTool).toBeDefined();

            if (listDevicesTool) {
                const mockDevices = [
                    {
                        entity_id: 'light.living_room',
                        state: 'on',
                        attributes: { brightness: 255 }
                    }
                ];

                // Setup response for this test
                mockFetch = mock(() => Promise.resolve(new Response(
                    JSON.stringify(mockDevices)
                )));
                globalThis.fetch = mockFetch;

                const result = await listDevicesTool.execute({}) as TestResponse;
                expect(result.success).toBe(true);
                expect(result.devices).toBeDefined();
            }
        });

        test('should execute control tool', async () => {
            const controlTool = addToolCalls.find(tool => tool.name === 'control');
            expect(controlTool).toBeDefined();

            if (controlTool) {
                // Setup response for this test
                mockFetch = mock(() => Promise.resolve(new Response(
                    JSON.stringify({ success: true })
                )));
                globalThis.fetch = mockFetch;

                const result = await controlTool.execute({
                    command: 'turn_on',
                    entity_id: 'light.living_room',
                    brightness: 255
                }) as TestResponse;

                expect(result.success).toBe(true);
                expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
            }
        });
    });

    describe('list_devices tool', () => {
        it('should successfully list devices', async () => {
            // Mock the fetch response for listing devices
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

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockDevices
            } as Response);

            // Get the tool registration
            const listDevicesTool = addToolCalls.find(call => call.name === 'list_devices');
            expect(listDevicesTool).toBeDefined();

            if (!listDevicesTool) {
                throw new Error('list_devices tool not found');
            }

            // Execute the tool
            const result = (await listDevicesTool.execute({})) as TestResponse;

            // Verify the results
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

        it('should handle fetch errors', async () => {
            // Mock a fetch error
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            // Get the tool registration
            const listDevicesTool = addToolCalls.find(call => call.name === 'list_devices');
            expect(listDevicesTool).toBeDefined();

            if (!listDevicesTool) {
                throw new Error('list_devices tool not found');
            }

            // Execute the tool
            const result = (await listDevicesTool.execute({})) as TestResponse;

            // Verify error handling
            expect(result.success).toBe(false);
            expect(result.message).toBe('Network error');
        });
    });

    describe('control tool', () => {
        it('should successfully control a light device', async () => {
            // Mock successful service call
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            } as Response);

            // Get the tool registration
            const controlTool = addToolCalls.find(call => call.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            // Execute the tool
            const result = (await controlTool.execute({
                command: 'turn_on',
                entity_id: 'light.living_room',
                brightness: 255
            })) as TestResponse;

            // Verify the results
            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully executed turn_on for light.living_room');

            // Verify the fetch call
            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/services/light/turn_on`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        entity_id: 'light.living_room',
                        brightness: 255
                    })
                }
            );
        });

        it('should handle unsupported domains', async () => {
            // Get the tool registration
            const controlTool = addToolCalls.find(call => call.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            // Execute the tool with an unsupported domain
            const result = (await controlTool.execute({
                command: 'turn_on',
                entity_id: 'unsupported.device'
            })) as TestResponse;

            // Verify error handling
            expect(result.success).toBe(false);
            expect(result.message).toBe('Unsupported domain: unsupported');
        });

        it('should handle service call errors', async () => {
            // Mock a failed service call
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Service unavailable'
            } as Response);

            // Get the tool registration
            const controlTool = addToolCalls.find(call => call.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            // Execute the tool
            const result = (await controlTool.execute({
                command: 'turn_on',
                entity_id: 'light.living_room'
            })) as TestResponse;

            // Verify error handling
            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to execute turn_on for light.living_room');
        });

        it('should handle climate device controls', async () => {
            // Mock successful service call
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            } as Response);

            // Get the tool registration
            const controlTool = addToolCalls.find(call => call.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            // Execute the tool
            const result = (await controlTool.execute({
                command: 'set_temperature',
                entity_id: 'climate.bedroom',
                temperature: 22,
                target_temp_high: 24,
                target_temp_low: 20
            })) as TestResponse;

            // Verify the results
            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully executed set_temperature for climate.bedroom');

            // Verify the fetch call
            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/services/climate/set_temperature`,
                {
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
                }
            );
        });

        it('should handle cover device controls', async () => {
            // Mock successful service call
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            } as Response);

            // Get the tool registration
            const controlTool = addToolCalls.find(call => call.name === 'control');
            expect(controlTool).toBeDefined();

            if (!controlTool) {
                throw new Error('control tool not found');
            }

            // Execute the tool
            const result = (await controlTool.execute({
                command: 'set_position',
                entity_id: 'cover.living_room',
                position: 50
            })) as TestResponse;

            // Verify the results
            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully executed set_position for cover.living_room');

            // Verify the fetch call
            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/services/cover/set_position`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        entity_id: 'cover.living_room',
                        position: 50
                    })
                }
            );
        });
    });

    describe('get_history tool', () => {
        test('should successfully fetch history', async () => {
            const mockHistory = [
                {
                    entity_id: 'light.living_room',
                    state: 'on',
                    last_changed: '2024-01-01T00:00:00Z',
                    attributes: { brightness: 255 }
                }
            ];

            // Setup response for this test
            mockFetch = mock(() => Promise.resolve(new Response(
                JSON.stringify(mockHistory)
            )));
            globalThis.fetch = mockFetch;

            const historyTool = addToolCalls.find(call => call.name === 'get_history');
            expect(historyTool).toBeDefined();

            if (!historyTool) {
                throw new Error('get_history tool not found');
            }

            const result = (await historyTool.execute({
                entity_id: 'light.living_room',
                start_time: '2024-01-01T00:00:00Z',
                end_time: '2024-01-01T02:00:00Z',
                minimal_response: true,
                significant_changes_only: true
            })) as TestResponse;

            // Verify the results
            expect(result.success).toBe(true);
            expect(result.history).toEqual(mockHistory);

            // Verify the fetch call was made with correct URL and parameters
            const calls = mockFetch.mock.calls;
            expect(calls.length).toBeGreaterThan(0);

            const firstCall = calls[0];
            if (!firstCall?.args) {
                throw new Error('No fetch calls recorded');
            }

            const [urlStr, options] = firstCall.args;
            const url = new URL(urlStr);
            expect(url.pathname).toContain('/api/history/period/2024-01-01T00:00:00Z');
            expect(url.searchParams.get('filter_entity_id')).toBe('light.living_room');
            expect(url.searchParams.get('minimal_response')).toBe('true');
            expect(url.searchParams.get('significant_changes_only')).toBe('true');

            expect(options).toEqual({
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
        });

        test('should handle fetch errors', async () => {
            // Setup error response
            mockFetch = mock(() => Promise.reject(new Error('Network error')));
            globalThis.fetch = mockFetch;

            const historyTool = addToolCalls.find(call => call.name === 'get_history');
            expect(historyTool).toBeDefined();

            if (!historyTool) {
                throw new Error('get_history tool not found');
            }

            const result = (await historyTool.execute({
                entity_id: 'light.living_room'
            })) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Network error');
        });
    });

    describe('scene tool', () => {
        it('should successfully list scenes', async () => {
            const mockScenes = [
                {
                    entity_id: 'scene.movie_time',
                    state: 'on',
                    attributes: {
                        friendly_name: 'Movie Time',
                        description: 'Perfect lighting for movies'
                    }
                },
                {
                    entity_id: 'scene.good_morning',
                    state: 'on',
                    attributes: {
                        friendly_name: 'Good Morning',
                        description: 'Bright lights to start the day'
                    }
                }
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenes
            } as Response);

            const sceneTool = addToolCalls.find(call => call.name === 'scene');
            expect(sceneTool).toBeDefined();

            if (!sceneTool) {
                throw new Error('scene tool not found');
            }

            const result = (await sceneTool.execute({
                action: 'list'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.scenes).toEqual([
                {
                    entity_id: 'scene.movie_time',
                    name: 'Movie Time',
                    description: 'Perfect lighting for movies'
                },
                {
                    entity_id: 'scene.good_morning',
                    name: 'Good Morning',
                    description: 'Bright lights to start the day'
                }
            ]);
        });

        it('should successfully activate a scene', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            } as Response);

            const sceneTool = addToolCalls.find(call => call.name === 'scene');
            expect(sceneTool).toBeDefined();

            if (!sceneTool) {
                throw new Error('scene tool not found');
            }

            const result = (await sceneTool.execute({
                action: 'activate',
                scene_id: 'scene.movie_time'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully activated scene scene.movie_time');

            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/services/scene/turn_on`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        entity_id: 'scene.movie_time'
                    })
                }
            );
        });
    });

    describe('notify tool', () => {
        it('should successfully send a notification', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            } as Response);

            const notifyTool = addToolCalls.find(call => call.name === 'notify');
            expect(notifyTool).toBeDefined();

            if (!notifyTool) {
                throw new Error('notify tool not found');
            }

            const result = (await notifyTool.execute({
                message: 'Test notification',
                title: 'Test Title',
                target: 'mobile_app_phone',
                data: { priority: 'high' }
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Notification sent successfully');

            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/services/notify/mobile_app_phone`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: 'Test notification',
                        title: 'Test Title',
                        data: { priority: 'high' }
                    })
                }
            );
        });

        it('should use default notification service when no target is specified', async () => {
            // Setup response for this test
            mockFetch = mock(() => Promise.resolve(new Response(
                JSON.stringify({})
            )));
            globalThis.fetch = mockFetch;

            const notifyTool = addToolCalls.find(call => call.name === 'notify');
            expect(notifyTool).toBeDefined();

            if (!notifyTool) {
                throw new Error('notify tool not found');
            }

            await notifyTool.execute({
                message: 'Test notification'
            });

            const calls = mockFetch.mock.calls;
            expect(calls.length).toBeGreaterThan(0);

            const [url, _options] = calls[0].args;
            expect(url.toString()).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/notify/notify`);
        });
    });

    describe('automation tool', () => {
        it('should successfully list automations', async () => {
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

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockAutomations
            } as Response);

            const automationTool = addToolCalls.find(call => call.name === 'automation');
            expect(automationTool).toBeDefined();

            if (!automationTool) {
                throw new Error('automation tool not found');
            }

            const result = (await automationTool.execute({
                action: 'list'
            })) as TestResponse;

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

        it('should successfully toggle an automation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            } as Response);

            const automationTool = addToolCalls.find(call => call.name === 'automation');
            expect(automationTool).toBeDefined();

            if (!automationTool) {
                throw new Error('automation tool not found');
            }

            const result = (await automationTool.execute({
                action: 'toggle',
                automation_id: 'automation.morning_routine'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully toggled automation automation.morning_routine');

            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/services/automation/toggle`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        entity_id: 'automation.morning_routine'
                    })
                }
            );
        });

        it('should successfully trigger an automation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            } as Response);

            const automationTool = addToolCalls.find(call => call.name === 'automation');
            expect(automationTool).toBeDefined();

            if (!automationTool) {
                throw new Error('automation tool not found');
            }

            const result = (await automationTool.execute({
                action: 'trigger',
                automation_id: 'automation.morning_routine'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully triggered automation automation.morning_routine');

            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/services/automation/trigger`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        entity_id: 'automation.morning_routine'
                    })
                }
            );
        });

        it('should require automation_id for toggle and trigger actions', async () => {
            const automationTool = addToolCalls.find(call => call.name === 'automation');
            expect(automationTool).toBeDefined();

            if (!automationTool) {
                throw new Error('automation tool not found');
            }

            const result = (await automationTool.execute({
                action: 'toggle'
            })) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Automation ID is required for toggle and trigger actions');
        });
    });

    describe('addon tool', () => {
        it('should successfully list add-ons', async () => {
            const mockAddons = {
                data: {
                    addons: [
                        {
                            name: 'File Editor',
                            slug: 'core_configurator',
                            description: 'Simple browser-based file editor',
                            version: '5.6.0',
                            installed: true,
                            available: true,
                            state: 'started'
                        },
                        {
                            name: 'Terminal & SSH',
                            slug: 'ssh',
                            description: 'Terminal access to your Home Assistant',
                            version: '9.6.1',
                            installed: false,
                            available: true,
                            state: 'not_installed'
                        }
                    ]
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockAddons
            } as Response);

            const addonTool = addToolCalls.find(call => call.name === 'addon');
            expect(addonTool).toBeDefined();

            if (!addonTool) {
                throw new Error('addon tool not found');
            }

            const result = (await addonTool.execute({
                action: 'list'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.addons).toEqual(mockAddons.data.addons);
        });

        it('should successfully install an add-on', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: { state: 'installing' } })
            } as Response);

            const addonTool = addToolCalls.find(call => call.name === 'addon');
            expect(addonTool).toBeDefined();

            if (!addonTool) {
                throw new Error('addon tool not found');
            }

            const result = (await addonTool.execute({
                action: 'install',
                slug: 'core_configurator',
                version: '5.6.0'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully installed add-on core_configurator');

            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/hassio/addons/core_configurator/install`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ version: '5.6.0' })
                }
            );
        });
    });

    describe('package tool', () => {
        it('should successfully list packages', async () => {
            const mockPackages = {
                repositories: [
                    {
                        name: 'HACS',
                        description: 'Home Assistant Community Store',
                        category: 'integration',
                        installed: true,
                        version_installed: '1.32.0',
                        available_version: '1.32.0',
                        authors: ['ludeeus'],
                        domain: 'hacs'
                    }
                ]
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockPackages
            } as Response);

            const packageTool = addToolCalls.find(call => call.name === 'package');
            expect(packageTool).toBeDefined();

            if (!packageTool) {
                throw new Error('package tool not found');
            }

            const result = (await packageTool.execute({
                action: 'list',
                category: 'integration'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.packages).toEqual(mockPackages.repositories);
        });

        it('should successfully install a package', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            } as Response);

            const packageTool = addToolCalls.find(call => call.name === 'package');
            expect(packageTool).toBeDefined();

            if (!packageTool) {
                throw new Error('package tool not found');
            }

            const result = (await packageTool.execute({
                action: 'install',
                category: 'integration',
                repository: 'hacs/integration',
                version: '1.32.0'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully installed package hacs/integration');

            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/hacs/repository/install`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        category: 'integration',
                        repository: 'hacs/integration',
                        version: '1.32.0'
                    })
                }
            );
        });
    });

    describe('automation_config tool', () => {
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

        it('should successfully create an automation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ automation_id: 'new_automation_1' })
            } as Response);

            const automationConfigTool = addToolCalls.find(call => call.name === 'automation_config');
            expect(automationConfigTool).toBeDefined();

            if (!automationConfigTool) {
                throw new Error('automation_config tool not found');
            }

            const result = (await automationConfigTool.execute({
                action: 'create',
                config: mockAutomationConfig
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully created automation');
            expect(result.automation_id).toBe('new_automation_1');

            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/config/automation/config`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mockAutomationConfig)
                }
            );
        });

        it('should successfully duplicate an automation', async () => {
            // Mock get existing automation
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockAutomationConfig
                } as Response)
                // Mock create new automation
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ automation_id: 'new_automation_2' })
                } as Response);

            const automationConfigTool = addToolCalls.find(call => call.name === 'automation_config');
            expect(automationConfigTool).toBeDefined();

            if (!automationConfigTool) {
                throw new Error('automation_config tool not found');
            }

            const result = (await automationConfigTool.execute({
                action: 'duplicate',
                automation_id: 'automation.test'
            })) as TestResponse;

            expect(result.success).toBe(true);
            expect(result.message).toBe('Successfully duplicated automation automation.test');
            expect(result.new_automation_id).toBe('new_automation_2');

            // Verify both API calls
            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/config/automation/config/automation.test`,
                expect.any(Object)
            );

            const duplicateConfig = { ...mockAutomationConfig, alias: 'Test Automation (Copy)' };
            expect(mockFetch).toHaveBeenCalledWith(
                `${TEST_CONFIG.HASS_HOST}/api/config/automation/config`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(duplicateConfig)
                }
            );
        });

        it('should require config for create action', async () => {
            const automationConfigTool = addToolCalls.find(call => call.name === 'automation_config');
            expect(automationConfigTool).toBeDefined();

            if (!automationConfigTool) {
                throw new Error('automation_config tool not found');
            }

            const result = (await automationConfigTool.execute({
                action: 'create'
            })) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Configuration is required for creating automation');
        });

        it('should require automation_id for update action', async () => {
            const automationConfigTool = addToolCalls.find(call => call[0].name === 'automation_config')?.[0];
            expect(automationConfigTool).toBeDefined();

            if (!automationConfigTool) {
                throw new Error('automation_config tool not found');
            }

            const result = (await automationConfigTool.execute({
                action: 'update',
                config: mockAutomationConfig
            })) as TestResponse;

            expect(result.success).toBe(false);
            expect(result.message).toBe('Automation ID and configuration are required for updating automation');
        });
    });
}); 