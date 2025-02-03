import type { Mock } from 'bun:test';

export interface SSEClient {
    id: string;
    ip: string;
    connectedAt: Date;
    send: Mock<(data: string) => void>;
    rateLimit: {
        count: number;
        lastReset: number;
    };
    connectionTime: number;
}

export interface SSEEvent {
    event_type: string;
    data: unknown;
    origin: string;
    time_fired: string;
    context: {
        id: string;
        [key: string]: unknown;
    };
}

export interface SSEMessage {
    type: string;
    data?: unknown;
    error?: string;
}

export interface SSEManagerConfig {
    maxClients?: number;
    pingInterval?: number;
    cleanupInterval?: number;
    maxConnectionAge?: number;
    rateLimitWindow?: number;
    maxRequestsPerWindow?: number;
}

export type MockSendFn = (data: string) => void;
export type MockSend = Mock<MockSendFn>; 