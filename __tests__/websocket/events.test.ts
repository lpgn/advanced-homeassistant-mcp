import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { HassWebSocketClient } from '../../src/websocket/client.js';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as HomeAssistant from '../../src/types/hass.js';

// Mock WebSocket
// // jest.mock('ws');

describe('WebSocket Event Handling', () => {
    let client: HassWebSocketClient;
    let mockWebSocket: jest.Mocked<WebSocket>;
    let eventEmitter: EventEmitter;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create event emitter for mocking WebSocket events
        eventEmitter = new EventEmitter();

        // Create mock WebSocket instance
        mockWebSocket = {
            on: jest.fn((event: string, listener: (...args: any[]) => void) => {
                eventEmitter.on(event, listener);
                return mockWebSocket;
            }),
            send: mock(),
            close: mock(),
            readyState: WebSocket.OPEN,
            removeAllListeners: mock(),
            // Add required WebSocket properties
            binaryType: 'arraybuffer',
            bufferedAmount: 0,
            extensions: '',
            protocol: '',
            url: 'ws://test.com',
            isPaused: () => false,
            ping: mock(),
            pong: mock(),
            terminate: mock()
        } as unknown as jest.Mocked<WebSocket>;

        // Mock WebSocket constructor
        (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWebSocket);

        // Create client instance
        client = new HassWebSocketClient('ws://test.com', 'test-token');
    });

    afterEach(() => {
        eventEmitter.removeAllListeners();
        client.disconnect();
    });

    test('should handle connection events', () => {
        // Simulate open event
        eventEmitter.emtest('open');

        // Verify authentication message was sent
        expect(mockWebSocket.send).toHaveBeenCalledWith(
            expect.stringContaining('"type":"auth"')
        );
    });

    test('should handle authentication response', () => {
        // Simulate auth_ok message
        eventEmitter.emtest('message', JSON.stringify({ type: 'auth_ok' }));

        // Verify client is ready for commands
        expect(mockWebSocket.readyState).toBe(WebSocket.OPEN);
    });

    test('should handle auth failure', () => {
        // Simulate auth_invalid message
        eventEmitter.emtest('message', JSON.stringify({
            type: 'auth_invalid',
            message: 'Invalid token'
        }));

        // Verify client attempts to close connection
        expect(mockWebSocket.close).toHaveBeenCalled();
    });

    test('should handle connection errors', () => {
        // Create error spy
        const errorSpy = mock();
        client.on('error', errorSpy);

        // Simulate error
        const testError = new Error('Test error');
        eventEmitter.emtest('error', testError);

        // Verify error was handled
        expect(errorSpy).toHaveBeenCalledWith(testError);
    });

    test('should handle disconnection', () => {
        // Create close spy
        const closeSpy = mock();
        client.on('close', closeSpy);

        // Simulate close
        eventEmitter.emtest('close');

        // Verify close was handled
        expect(closeSpy).toHaveBeenCalled();
    });

    test('should handle event messages', () => {
        // Create event spy
        const eventSpy = mock();
        client.on('event', eventSpy);

        // Simulate event message
        const eventData = {
            type: 'event',
            event: {
                event_type: 'state_changed',
                data: {
                    entity_id: 'light.test',
                    new_state: { state: 'on' }
                }
            }
        };
        eventEmitter.emtest('message', JSON.stringify(eventData));

        // Verify event was handled
        expect(eventSpy).toHaveBeenCalledWith(eventData.event);
    });

    describe('Connection Events', () => {
        test('should handle successful connection', (done) => {
            client.on('open', () => {
                expect(mockWebSocket.send).toHaveBeenCalled();
                done();
            });

            eventEmitter.emtest('open');
        });

        test('should handle connection errors', (done) => {
            const error = new Error('Connection failed');
            client.on('error', (err: Error) => {
                expect(err).toBe(error);
                done();
            });

            eventEmitter.emtest('error', error);
        });

        test('should handle connection close', (done) => {
            client.on('disconnected', () => {
                expect(mockWebSocket.close).toHaveBeenCalled();
                done();
            });

            eventEmitter.emtest('close');
        });
    });

    describe('Authentication', () => {
        test('should send authentication message on connect', () => {
            const authMessage: HomeAssistant.AuthMessage = {
                type: 'auth',
                access_token: 'test_token'
            };

            client.connect();
            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(authMessage));
        });

        test('should handle successful authentication', (done) => {
            client.on('auth_ok', () => {
                done();
            });

            client.connect();
            eventEmitter.emtest('message', JSON.stringify({ type: 'auth_ok' }));
        });

        test('should handle authentication failure', (done) => {
            client.on('auth_invalid', () => {
                done();
            });

            client.connect();
            eventEmitter.emtest('message', JSON.stringify({ type: 'auth_invalid' }));
        });
    });

    describe('Event Subscription', () => {
        test('should handle state changed events', (done) => {
            const stateEvent: HomeAssistant.StateChangedEvent = {
                event_type: 'state_changed',
                data: {
                    entity_id: 'light.living_room',
                    new_state: {
                        entity_id: 'light.living_room',
                        state: 'on',
                        attributes: { brightness: 255 },
                        last_changed: '2024-01-01T00:00:00Z',
                        last_updated: '2024-01-01T00:00:00Z',
                        context: {
                            id: '123',
                            parent_id: null,
                            user_id: null
                        }
                    },
                    old_state: {
                        entity_id: 'light.living_room',
                        state: 'off',
                        attributes: {},
                        last_changed: '2024-01-01T00:00:00Z',
                        last_updated: '2024-01-01T00:00:00Z',
                        context: {
                            id: '122',
                            parent_id: null,
                            user_id: null
                        }
                    }
                },
                origin: 'LOCAL',
                time_fired: '2024-01-01T00:00:00Z',
                context: {
                    id: '123',
                    parent_id: null,
                    user_id: null
                }
            };

            client.on('event', (event) => {
                expect(event.data.entity_id).toBe('light.living_room');
                expect(event.data.new_state.state).toBe('on');
                expect(event.data.old_state.state).toBe('off');
                done();
            });

            eventEmitter.emtest('message', JSON.stringify({ type: 'event', event: stateEvent }));
        });

        test('should subscribe to specific events', async () => {
            const subscriptionId = 1;
            const callback = mock();

            // Mock successful subscription
            const subscribePromise = client.subscribeEvents('state_changed', callback);
            eventEmitter.emtest('message', JSON.stringify({
                id: 1,
                type: 'result',
                success: true
            }));

            await expect(subscribePromise).resolves.toBe(subscriptionId);

            // Test event handling
            const eventData = {
                entity_id: 'light.living_room',
                state: 'on'
            };
            eventEmitter.emtest('message', JSON.stringify({
                type: 'event',
                event: {
                    event_type: 'state_changed',
                    data: eventData
                }
            }));

            expect(callback).toHaveBeenCalledWith(eventData);
        });

        test('should unsubscribe from events', async () => {
            // First subscribe
            const subscriptionId = await client.subscribeEvents('state_changed', () => { });

            // Then unsubscribe
            const unsubscribePromise = client.unsubscribeEvents(subscriptionId);
            eventEmitter.emtest('message', JSON.stringify({
                id: 2,
                type: 'result',
                success: true
            }));

            await expect(unsubscribePromise).resolves.toBeUndefined();
        });
    });

    describe('Message Handling', () => {
        test('should handle malformed messages', (done) => {
            client.on('error', (error: Error) => {
                expect(error.message).toContain('Unexpected token');
                done();
            });

            eventEmitter.emtest('message', 'invalid json');
        });

        test('should handle unknown message types', (done) => {
            const unknownMessage = {
                type: 'unknown_type',
                data: {}
            };

            client.on('error', (error: Error) => {
                expect(error.message).toContain('Unknown message type');
                done();
            });

            eventEmitter.emtest('message', JSON.stringify(unknownMessage));
        });
    });

    describe('Reconnection', () => {
        test('should attempt to reconnect on connection loss', (done) => {
            let reconnectAttempts = 0;
            client.on('disconnected', () => {
                reconnectAttempts++;
                if (reconnectAttempts === 1) {
                    expect(WebSocket).toHaveBeenCalledTimes(2);
                    done();
                }
            });

            eventEmitter.emtest('close');
        });

        test('should re-authenticate after reconnection', (done) => {
            client.connect();

            client.on('auth_ok', () => {
                done();
            });

            eventEmitter.emtest('close');
            eventEmitter.emtest('open');
            eventEmitter.emtest('message', JSON.stringify({ type: 'auth_ok' }));
        });
    });
}); 