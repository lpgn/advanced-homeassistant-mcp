import { afterEach, mock, expect } from "bun:test";

// Setup global mocks
global.fetch = mock(() => Promise.resolve(new Response()));

// Mock WebSocket
class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    url: string;
    readyState: number = MockWebSocket.CLOSED;
    onopen: ((event: any) => void) | null = null;
    onclose: ((event: any) => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            this.onopen?.({ type: 'open' });
        }, 0);
    }

    send = mock((data: string) => {
        if (this.readyState !== MockWebSocket.OPEN) {
            throw new Error('WebSocket is not open');
        }
    });

    close = mock(() => {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ type: 'close', code: 1000, reason: '', wasClean: true });
    });
}

// Add WebSocket to global
(global as any).WebSocket = MockWebSocket;

// Reset all mocks after each test
afterEach(() => {
    mock.restore();
});

// Add custom matchers
expect.extend({
    toBeValidResponse(received: Response) {
        const pass = received instanceof Response && received.ok;
        return {
            message: () =>
                `expected ${received instanceof Response ? 'Response' : typeof received} to${pass ? ' not' : ''} be a valid Response`,
            pass
        };
    },
    toBeValidWebSocket(received: any) {
        const pass = received instanceof MockWebSocket;
        return {
            message: () =>
                `expected ${received instanceof MockWebSocket ? 'MockWebSocket' : typeof received} to${pass ? ' not' : ''} be a valid WebSocket`,
            pass
        };
    }
}); 