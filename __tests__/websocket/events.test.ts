import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import { EventEmitter } from "events";
import { HassWebSocketClient } from "../../src/websocket/client";
import type { MessageEvent, ErrorEvent } from "ws";
import { Mock, fn as jestMock } from 'jest-mock';
import { expect as jestExpect } from '@jest/globals';

describe('WebSocket Event Handling', () => {
    let client: HassWebSocketClient;
    let mockWebSocket: any;
    let onOpenCallback: () => void;
    let onCloseCallback: () => void;
    let onErrorCallback: (event: any) => void;
    let onMessageCallback: (event: any) => void;
    let eventEmitter: EventEmitter;

    beforeEach(() => {
        eventEmitter = new EventEmitter();

        // Initialize callbacks first
        onOpenCallback = () => { };
        onCloseCallback = () => { };
        onErrorCallback = () => { };
        onMessageCallback = () => { };

        mockWebSocket = {
            send: mock(),
            close: mock(),
            readyState: 1,
            OPEN: 1,
            onopen: null,
            onclose: null,
            onerror: null,
            onmessage: null
        };

        // Define setters that store the callbacks
        Object.defineProperties(mockWebSocket, {
            onopen: {
                get() { return onOpenCallback; },
                set(callback: () => void) { onOpenCallback = callback; }
            },
            onclose: {
                get() { return onCloseCallback; },
                set(callback: () => void) { onCloseCallback = callback; }
            },
            onerror: {
                get() { return onErrorCallback; },
                set(callback: (event: any) => void) { onErrorCallback = callback; }
            },
            onmessage: {
                get() { return onMessageCallback; },
                set(callback: (event: any) => void) { onMessageCallback = callback; }
            }
        });

        // @ts-expect-error - Mock WebSocket implementation
        global.WebSocket = mock(() => mockWebSocket);

        client = new HassWebSocketClient('ws://localhost:8123/api/websocket', 'test-token');
    });

    afterEach(() => {
        if (eventEmitter) {
            eventEmitter.removeAllListeners();
        }
        if (client) {
            client.disconnect();
        }
    });

    test('should handle connection events', async () => {
        const connectPromise = client.connect();
        onOpenCallback();
        await connectPromise;
        expect(client.isConnected()).toBe(true);
    });

    test('should handle authentication response', async () => {
        const connectPromise = client.connect();
        onOpenCallback();

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_required'
            })
        });

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_ok'
            })
        });

        await connectPromise;
        expect(client.isAuthenticated()).toBe(true);
    });

    test('should handle auth failure', async () => {
        const connectPromise = client.connect();
        onOpenCallback();

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_required'
            })
        });

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_invalid',
                message: 'Invalid password'
            })
        });

        await expect(connectPromise).rejects.toThrow('Authentication failed');
        expect(client.isAuthenticated()).toBe(false);
    });

    test('should handle connection errors', async () => {
        const errorPromise = new Promise((resolve) => {
            client.once('error', resolve);
        });

        const connectPromise = client.connect().catch(() => { /* Expected error */ });
        onOpenCallback();

        const errorEvent = new Error('Connection failed');
        onErrorCallback({ error: errorEvent });

        const error = await errorPromise;
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toBe('Connection failed');
    });

    test('should handle disconnection', async () => {
        const connectPromise = client.connect();
        onOpenCallback();
        await connectPromise;

        const disconnectPromise = new Promise((resolve) => {
            client.on('disconnected', resolve);
        });

        onCloseCallback();

        await disconnectPromise;
        expect(client.isConnected()).toBe(false);
    });

    test('should handle event messages', async () => {
        const connectPromise = client.connect();
        onOpenCallback();

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_required'
            })
        });

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_ok'
            })
        });

        await connectPromise;

        const eventPromise = new Promise((resolve) => {
            client.on('state_changed', resolve);
        });

        const eventData = {
            id: 1,
            type: 'event',
            event: {
                event_type: 'state_changed',
                data: {
                    entity_id: 'light.test',
                    new_state: { state: 'on' }
                }
            }
        };

        onMessageCallback({
            data: JSON.stringify(eventData)
        });

        const receivedEvent = await eventPromise;
        expect(receivedEvent).toEqual(eventData.event.data);
    });

    test('should subscribe to specific events', async () => {
        const connectPromise = client.connect();
        onOpenCallback();

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_required'
            })
        });

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_ok'
            })
        });

        await connectPromise;

        const subscriptionId = await client.subscribeEvents('state_changed', (data) => {
            // Empty callback for type satisfaction
        });
        expect(mockWebSocket.send).toHaveBeenCalled();
        expect(subscriptionId).toBeDefined();
    });

    test('should unsubscribe from events', async () => {
        const connectPromise = client.connect();
        onOpenCallback();

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_required'
            })
        });

        onMessageCallback({
            data: JSON.stringify({
                type: 'auth_ok'
            })
        });

        await connectPromise;

        const subscriptionId = await client.subscribeEvents('state_changed', (data) => {
            // Empty callback for type satisfaction
        });
        await client.unsubscribeEvents(subscriptionId);

        expect(mockWebSocket.send).toHaveBeenCalled();
    });
}); 