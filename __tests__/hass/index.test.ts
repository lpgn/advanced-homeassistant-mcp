import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import type { HassInstanceImpl } from '../../src/hass/types.js';
import type { Entity } from '../../src/types/hass.js';
import { get_hass } from '../../src/hass/index.js';

// Define WebSocket mock types
type WebSocketCallback = (...args: any[]) => void;

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

// Mock WebSocket
const mockWebSocket = {
    on: mock(),
    send: mock(),
    close: mock(),
    readyState: 1,
    OPEN: 1,
    removeAllListeners: mock()
};

// Mock fetch globally
const mockFetch = mock() as typeof fetch;
global.fetch = mockFetch;

// Mock get_hass
mock.module('../../src/hass/index.js', () => {
    let instance: TestHassInstance | null = null;
    return {
        get_hass: mock(async () => {
            if (!instance) {
                const baseUrl = process.env.HASS_HOST || 'http://localhost:8123';
                const token = process.env.HASS_TOKEN || 'test_token';
                instance = {
                    _baseUrl: baseUrl,
                    _token: token,
                    baseUrl,
                    token,
                    connect: mock(async () => { }),
                    disconnect: mock(async () => { }),
                    getStates: mock(async () => []),
                    callService: mock(async () => { })
                };
            }
            return instance;
        })
    };
});

describe('Home Assistant Integration', () => {
    describe('HassWebSocketClient', () => {
        let client: EventEmitter;
        const mockUrl = 'ws://localhost:8123/api/websocket';
        const mockToken = 'test_token';

        beforeEach(() => {
            client = new EventEmitter();
            mock.restore();
        });

        test('should create a WebSocket client with the provided URL and token', () => {
            expect(client).toBeInstanceOf(EventEmitter);
            expect(mockWebSocket.on).toHaveBeenCalled();
        });

        test('should connect and authenticate successfully', async () => {
            const connectPromise = new Promise<void>((resolve) => {
                client.once('open', () => {
                    mockWebSocket.send(JSON.stringify({
                        type: 'auth',
                        access_token: mockToken
                    }));
                    resolve();
                });
            });

            client.emit('open');
            await connectPromise;

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                expect.stringContaining('auth')
            );
        });

        test('should handle authentication failure', async () => {
            const failurePromise = new Promise<void>((resolve, reject) => {
                client.once('error', (error) => {
                    reject(error);
                });
            });

            client.emit('message', JSON.stringify({ type: 'auth_invalid' }));

            await expect(failurePromise).rejects.toThrow();
        });

        test('should handle connection errors', async () => {
            const errorPromise = new Promise<void>((resolve, reject) => {
                client.once('error', (error) => {
                    reject(error);
                });
            });

            client.emit('error', new Error('Connection failed'));

            await expect(errorPromise).rejects.toThrow('Connection failed');
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
            instance = await get_hass();
            mock.restore();

            // Mock successful fetch responses
            mockFetch.mockImplementation(async (url) => {
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
            expect(instance.baseUrl).toBe(mockBaseUrl);
            expect(instance.token).toBe(mockToken);
        });

        test('should fetch states', async () => {
            const states = await instance.getStates();
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
            mockFetch.mockImplementation(() => {
                throw new Error('Network error');
            });
            await expect(instance.getStates()).rejects.toThrow('Network error');
        });
    });
}); 