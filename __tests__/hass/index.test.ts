import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import type { HassInstanceImpl } from '../../src/hass/index.js';
import type { Entity, HassEvent } from '../../src/types/hass.js';
import { get_hass } from '../../src/hass/index.js';

// Define WebSocket mock types
type WebSocketCallback = (...args: any[]) => void;
type WebSocketEventHandler = (event: string, callback: WebSocketCallback) => void;
type WebSocketSendHandler = (data: string) => void;
type WebSocketCloseHandler = () => void;

interface MockHassServices {
    light: Record<string, unknown>;
    climate: Record<string, unknown>;
    switch: Record<string, unknown>;
    media_player: Record<string, unknown>;
}

interface MockHassInstance {
    services: MockHassServices;
}

// Extend HassInstanceImpl for testing
interface TestHassInstance extends HassInstanceImpl {
    _baseUrl: string;
    _token: string;
}

type WebSocketMock = {
    on: jest.MockedFunction<WebSocketEventHandler>;
    send: jest.MockedFunction<WebSocketSendHandler>;
    close: jest.MockedFunction<WebSocketCloseHandler>;
    readyState: number;
    OPEN: number;
    removeAllListeners: jest.MockedFunction<() => void>;
};

// Mock WebSocket
const mockWebSocket: WebSocketMock = {
    on: jest.fn<WebSocketEventHandler>(),
    send: jest.fn<WebSocketSendHandler>(),
    close: jest.fn<WebSocketCloseHandler>(),
    readyState: 1,
    OPEN: 1,
    removeAllListeners: mock()
};

// // jest.mock('ws', () => ({
    WebSocket: mock().mockImplementation(() => mockWebSocket)
}));

// Mock fetch globally
const mockFetch = mock() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock get_hass
// // jest.mock('../../src/hass/index.js', () => {
    let instance: TestHassInstance | null = null;
    const actual = jest.requireActual<typeof import('../../src/hass/index.js')>('../../src/hass/index.js');
    return {
        get_hass: jest.fn(async () => {
            if (!instance) {
                const baseUrl = process.env.HASS_HOST || 'http://localhost:8123';
                const token = process.env.HASS_TOKEN || 'test_token';
                instance = new actual.HassInstanceImpl(baseUrl, token) as TestHassInstance;
                instance._baseUrl = baseUrl;
                instance._token = token;
            }
            return instance;
        })
    };
});

describe('Home Assistant Integration', () => {
    describe('HassWebSocketClient', () => {
        let client: any;
        const mockUrl = 'ws://localhost:8123/api/websocket';
        const mockToken = 'test_token';

        beforeEach(async () => {
            const { HassWebSocketClient } = await import('../../src/hass/index.js');
            client = new HassWebSocketClient(mockUrl, mockToken);
            jest.clearAllMocks();
        });

        test('should create a WebSocket client with the provided URL and token', () => {
            expect(client).toBeInstanceOf(EventEmitter);
            expect(// // jest.mocked(WebSocket)).toHaveBeenCalledWith(mockUrl);
        });

        test('should connect and authenticate successfully', async () => {
            const connectPromise = client.connect();

            // Get and call the open callback
            const openCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (!openCallback) throw new Error('Open callback not found');
            openCallback();

            // Verify authentication message
            expect(mockWebSocket.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'auth',
                    access_token: mockToken
                })
            );

            // Get and call the message callback
            const messageCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
            if (!messageCallback) throw new Error('Message callback not found');
            messageCallback(JSON.stringify({ type: 'auth_ok' }));

            await connectPromise;
        });

        test('should handle authentication failure', async () => {
            const connectPromise = client.connect();

            // Get and call the open callback
            const openCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (!openCallback) throw new Error('Open callback not found');
            openCallback();

            // Get and call the message callback with auth failure
            const messageCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
            if (!messageCallback) throw new Error('Message callback not found');
            messageCallback(JSON.stringify({ type: 'auth_invalid' }));

            await expect(connectPromise).rejects.toThrow();
        });

        test('should handle connection errors', async () => {
            const connectPromise = client.connect();

            // Get and call the error callback
            const errorCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'error')?.[1];
            if (!errorCallback) throw new Error('Error callback not found');
            errorCallback(new Error('Connection failed'));

            await expect(connectPromise).rejects.toThrow('Connection failed');
        });

        test('should handle message parsing errors', async () => {
            const connectPromise = client.connect();

            // Get and call the open callback
            const openCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (!openCallback) throw new Error('Open callback not found');
            openCallback();

            // Get and call the message callback with invalid JSON
            const messageCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
            if (!messageCallback) throw new Error('Message callback not found');

            // Should emit error event
            await expect(new Promise((resolve) => {
                client.once('error', resolve);
                messageCallback('invalid json');
            })).resolves.toBeInstanceOf(Error);
        });
    });

    describe('HassInstanceImpl', () => {
        let instance: HassInstanceImpl;
        const mockBaseUrl = 'http://localhost:8123';
        const mockToken = 'test_token';
        const mockState: Entity = {
            entity_id: 'light.test',
            state: 'on',
            attributes: {},
            last_changed: '',
            last_updated: '',
            context: {
                id: '',
                parent_id: null,
                user_id: null
            }
        };

        beforeEach(async () => {
            const { HassInstanceImpl } = await import('../../src/hass/index.js');
            instance = new HassInstanceImpl(mockBaseUrl, mockToken);
            jest.clearAllMocks();

            // Mock successful fetch responses
            mockFetch.mockImplementation(async (url, init) => {
                if (url.toString().endsWith('/api/states')) {
                    return new Response(JSON.stringify([mockState]));
                }
                if (url.toString().includes('/api/states/')) {
                    return new Response(JSON.stringify(mockState));
                }
                if (url.toString().endsWith('/api/services')) {
                    return new Response(JSON.stringify([]));
                }
                return new Response(JSON.stringify({}));
            });
        });

        test('should create instance with correct properties', () => {
            expect(instance['baseUrl']).toBe(mockBaseUrl);
            expect(instance['token']).toBe(mockToken);
        });

        test('should fetch states', async () => {
            const states = await instance.fetchStates();
            expect(states).toEqual([mockState]);
            expect(mockFetch).toHaveBeenCalledWith(
                `${mockBaseUrl}/api/states`,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${mockToken}`
                    })
                })
            );
        });

        test('should fetch single state', async () => {
            const state = await instance.fetchState('light.test');
            expect(state).toEqual(mockState);
            expect(mockFetch).toHaveBeenCalledWith(
                `${mockBaseUrl}/api/states/light.test`,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${mockToken}`
                    })
                })
            );
        });

        test('should call service', async () => {
            await instance.callService('light', 'turn_on', { entity_id: 'light.test' });
            expect(mockFetch).toHaveBeenCalledWith(
                `${mockBaseUrl}/api/services/light/turn_on`,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${mockToken}`,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({ entity_id: 'light.test' })
                })
            );
        });

        test('should handle fetch errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            await expect(instance.fetchStates()).rejects.toThrow('Network error');
        });

        test('should handle invalid JSON responses', async () => {
            mockFetch.mockResolvedValueOnce(new Response('invalid json'));
            await expect(instance.fetchStates()).rejects.toThrow();
        });

        test('should handle non-200 responses', async () => {
            mockFetch.mockResolvedValueOnce(new Response('Error', { status: 500 }));
            await expect(instance.fetchStates()).rejects.toThrow();
        });

        describe('Event Subscription', () => {
            let eventCallback: (event: HassEvent) => void;

            beforeEach(() => {
                eventCallback = mock();
            });

            test('should subscribe to events', async () => {
                const subscriptionId = await instance.subscribeEvents(eventCallback);
                expect(typeof subscriptionId).toBe('number');
            });

            test('should unsubscribe from events', async () => {
                const subscriptionId = await instance.subscribeEvents(eventCallback);
                await instance.unsubscribeEvents(subscriptionId);
            });
        });
    });

    describe('get_hass', () => {
        const originalEnv = process.env;

        const createMockServices = (): MockHassServices => ({
            light: {},
            climate: {},
            switch: {},
            media_player: {}
        });

        beforeEach(() => {
            process.env = { ...originalEnv };
            process.env.HASS_HOST = 'http://localhost:8123';
            process.env.HASS_TOKEN = 'test_token';

            // Reset the mock implementation
            (get_hass as jest.MockedFunction<typeof get_hass>).mockImplementation(async () => {
                const actual = jest.requireActual<typeof import('../../src/hass/index.js')>('../../src/hass/index.js');
                const baseUrl = process.env.HASS_HOST || 'http://localhost:8123';
                const token = process.env.HASS_TOKEN || 'test_token';
                const instance = new actual.HassInstanceImpl(baseUrl, token) as TestHassInstance;
                instance._baseUrl = baseUrl;
                instance._token = token;
                return instance;
            });
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        test('should create instance with default configuration', async () => {
            const instance = await get_hass() as TestHassInstance;
            expect(instance._baseUrl).toBe('http://localhost:8123');
            expect(instance._token).toBe('test_token');
        });

        test('should reuse existing instance', async () => {
            const instance1 = await get_hass();
            const instance2 = await get_hass();
            expect(instance1).toBe(instance2);
        });

        test('should use custom configuration', async () => {
            process.env.HASS_HOST = 'https://hass.example.com';
            process.env.HASS_TOKEN = 'prod_token';
            const instance = await get_hass() as TestHassInstance;
            expect(instance._baseUrl).toBe('https://hass.example.com');
            expect(instance._token).toBe('prod_token');
        });
    });
}); 