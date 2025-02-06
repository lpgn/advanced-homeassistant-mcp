import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { get_hass } from '../../src/hass/index.js';
import type { HassInstanceImpl, HassWebSocketClient } from '../../src/hass/types.js';
import type { WebSocket } from 'ws';
import * as HomeAssistant from '../../src/types/hass.js';

// Add DOM types for WebSocket and events
type CloseEvent = {
    code: number;
    reason: string;
    wasClean: boolean;
};

type MessageEvent = {
    data: any;
    type: string;
    lastEventId: string;
};

type Event = {
    type: string;
};

interface WebSocketLike {
    send(data: string): void;
    close(): void;
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
    dispatchEvent(event: Event): boolean;
    onopen: ((event: Event) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    url: string;
    readyState: number;
    bufferedAmount: number;
    extensions: string;
    protocol: string;
    binaryType: string;
}

interface MockWebSocketInstance extends WebSocketLike {
    send: mock.Mock;
    close: mock.Mock;
    addEventListener: mock.Mock;
    removeEventListener: mock.Mock;
    dispatchEvent: mock.Mock;
}

interface MockWebSocketConstructor extends mock.Mock<MockWebSocketInstance> {
    CONNECTING: 0;
    OPEN: 1;
    CLOSING: 2;
    CLOSED: 3;
    prototype: WebSocketLike;
}

interface MockWebSocket extends WebSocket {
    send: typeof mock;
    close: typeof mock;
    addEventListener: typeof mock;
    removeEventListener: typeof mock;
    dispatchEvent: typeof mock;
}

const createMockWebSocket = (): MockWebSocket => ({
    send: mock(),
    close: mock(),
    addEventListener: mock(),
    removeEventListener: mock(),
    dispatchEvent: mock(),
    readyState: 1,
    OPEN: 1,
    url: '',
    protocol: '',
    extensions: '',
    bufferedAmount: 0,
    binaryType: 'blob',
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null
});

// Mock the entire hass module
mock.module('../../src/hass/index.js', () => ({
    get_hass: mock()
}));

describe('Home Assistant API', () => {
    let hass: HassInstanceImpl;
    let mockWs: MockWebSocket;
    let MockWebSocket: MockWebSocketConstructor;

    beforeEach(() => {
        mockWs = createMockWebSocket();
        hass = {
            baseUrl: 'http://localhost:8123',
            token: 'test-token',
            connect: mock(async () => { }),
            disconnect: mock(async () => { }),
            getStates: mock(async () => []),
            callService: mock(async () => { })
        };

        // Create a mock WebSocket constructor
        MockWebSocket = mock().mockImplementation(() => mockWs) as MockWebSocketConstructor;
        MockWebSocket.CONNECTING = 0;
        MockWebSocket.OPEN = 1;
        MockWebSocket.CLOSING = 2;
        MockWebSocket.CLOSED = 3;
        MockWebSocket.prototype = {} as WebSocketLike;

        // Mock WebSocket globally
        (global as any).WebSocket = MockWebSocket;
    });

    afterEach(() => {
        mock.restore();
    });

    describe('State Management', () => {
        test('should fetch all states', async () => {
            const mockStates: HomeAssistant.Entity[] = [
                {
                    entity_id: 'light.living_room',
                    state: 'on',
                    attributes: { brightness: 255 },
                    last_changed: '2024-01-01T00:00:00Z',
                    last_updated: '2024-01-01T00:00:00Z',
                    context: { id: '123', parent_id: null, user_id: null }
                }
            ];

            global.fetch = mock().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockStates)
            });

            const states = await hass.fetchStates();
            expect(states).toEqual(mockStates);
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8123/api/states',
                expect.any(Object)
            );
        });

        test('should fetch single state', async () => {
            const mockState: HomeAssistant.Entity = {
                entity_id: 'light.living_room',
                state: 'on',
                attributes: { brightness: 255 },
                last_changed: '2024-01-01T00:00:00Z',
                last_updated: '2024-01-01T00:00:00Z',
                context: { id: '123', parent_id: null, user_id: null }
            };

            global.fetch = mock().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockState)
            });

            const state = await hass.fetchState('light.living_room');
            expect(state).toEqual(mockState);
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8123/api/states/light.living_room',
                expect.any(Object)
            );
        });

        test('should handle state fetch errors', async () => {
            global.fetch = mock().mockRejectedValueOnce(new Error('Failed to fetch states'));

            await expect(hass.fetchStates()).rejects.toThrow('Failed to fetch states');
        });
    });

    describe('Service Calls', () => {
        test('should call service', async () => {
            global.fetch = mock().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });

            await hass.callService('light', 'turn_on', {
                entity_id: 'light.living_room',
                brightness: 255
            });

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8123/api/services/light/turn_on',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        entity_id: 'light.living_room',
                        brightness: 255
                    })
                })
            );
        });

        test('should handle service call errors', async () => {
            global.fetch = mock().mockRejectedValueOnce(new Error('Service call failed'));

            await expect(
                hass.callService('invalid_domain', 'invalid_service', {})
            ).rejects.toThrow('Service call failed');
        });
    });

    describe('Event Subscription', () => {
        test('should subscribe to events', async () => {
            const callback = mock();
            await hass.subscribeEvents(callback, 'state_changed');

            expect(MockWebSocket).toHaveBeenCalledWith(
                'ws://localhost:8123/api/websocket'
            );
        });

        test('should handle subscription errors', async () => {
            const callback = mock();
            MockWebSocket.mockImplementation(() => {
                throw new Error('WebSocket connection failed');
            });

            await expect(
                hass.subscribeEvents(callback, 'state_changed')
            ).rejects.toThrow('WebSocket connection failed');
        });
    });

    describe('WebSocket connection', () => {
        test('should connect to WebSocket endpoint', async () => {
            await hass.subscribeEvents(() => { });
            expect(MockWebSocket).toHaveBeenCalledWith(
                'ws://localhost:8123/api/websocket'
            );
        });

        test('should handle connection errors', async () => {
            MockWebSocket.mockImplementation(() => {
                throw new Error('Connection failed');
            });

            await expect(hass.subscribeEvents(() => { })).rejects.toThrow(
                'Connection failed'
            );
        });
    });
}); 