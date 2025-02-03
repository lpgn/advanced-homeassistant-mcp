import { SSEManager } from '../index';
import { TokenManager } from '../../security/index';
import { EventEmitter } from 'events';

describe('SSE Security Features', () => {
    let sseManager: SSEManager;
    const validToken = 'valid_token';
    const testIp = '127.0.0.1';

    const createTestClient = (id: string) => ({
        id,
        ip: testIp,
        connectedAt: new Date(),
        send: jest.fn(),
        rateLimit: {
            count: 0,
            lastReset: Date.now()
        },
        connectionTime: Date.now()
    });

    beforeEach(() => {
        sseManager = new SSEManager({
            maxClients: 10,
            pingInterval: 100,
            cleanupInterval: 200,
            maxConnectionAge: 1000
        });
        jest.spyOn(TokenManager, 'validateToken').mockReturnValue({ valid: true });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Client Authentication', () => {
        it('should authenticate valid clients', () => {
            const client = createTestClient('test-client-1');
            const result = sseManager.addClient(client, validToken);

            expect(result).toBeTruthy();
            expect(result?.authenticated).toBe(true);
            expect(TokenManager.validateToken).toHaveBeenCalledWith(validToken, testIp);
        });

        it('should reject invalid tokens', () => {
            jest.spyOn(TokenManager, 'validateToken').mockReturnValue({
                valid: false,
                error: 'Invalid token'
            });

            const client = createTestClient('test-client-2');
            const result = sseManager.addClient(client, 'invalid_token');

            expect(result).toBeNull();
            expect(TokenManager.validateToken).toHaveBeenCalledWith('invalid_token', testIp);
        });

        it('should enforce maximum client limit', () => {
            const sseManager = new SSEManager({ maxClients: 2 });

            // Add maximum number of clients
            for (let i = 0; i < 2; i++) {
                const client = createTestClient(`test-client-${i}`);
                const result = sseManager.addClient(client, validToken);
                expect(result).toBeTruthy();
            }

            // Try to add one more client
            const extraClient = createTestClient('extra-client');
            const result = sseManager.addClient(extraClient, validToken);
            expect(result).toBeNull();
        });
    });

    describe('Client Management', () => {
        it('should track client connections', () => {
            const client = createTestClient('test-client');
            sseManager.addClient(client, validToken);
            const stats = sseManager.getStatistics();

            expect(stats.totalClients).toBe(1);
            expect(stats.authenticatedClients).toBe(1);
            expect(stats.clientStats).toHaveLength(1);
            expect(stats.clientStats[0].ip).toBe(testIp);
        });

        it('should remove disconnected clients', () => {
            const client = createTestClient('test-client');
            sseManager.addClient(client, validToken);
            sseManager.removeClient(client.id);
            const stats = sseManager.getStatistics();

            expect(stats.totalClients).toBe(0);
        });

        it('should cleanup inactive clients', async () => {
            const sseManager = new SSEManager({
                maxClients: 10,
                pingInterval: 100,
                cleanupInterval: 200,
                maxConnectionAge: 300
            });

            const client = createTestClient('test-client');
            client.connectedAt = new Date(Date.now() - 400); // Older than maxConnectionAge
            sseManager.addClient(client, validToken);

            // Wait for cleanup interval
            await new Promise(resolve => setTimeout(resolve, 250));

            const stats = sseManager.getStatistics();
            expect(stats.totalClients).toBe(0);
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limits for message sending', () => {
            const client = createTestClient('test-client');
            const sseClient = sseManager.addClient(client, validToken);
            expect(sseClient).toBeTruthy();

            // Send messages up to rate limit
            for (let i = 0; i < 1000; i++) {
                sseManager['sendToClient'](sseClient!, { type: 'test', data: i });
            }

            // Next message should trigger rate limit
            sseManager['sendToClient'](sseClient!, { type: 'test', data: 'overflow' });

            const lastCall = client.send.mock.calls[client.send.mock.calls.length - 1][0];
            expect(JSON.parse(lastCall)).toMatchObject({
                type: 'error',
                error: 'rate_limit_exceeded'
            });
        });

        it('should reset rate limits after window expires', async () => {
            const client = createTestClient('test-client');
            const sseClient = sseManager.addClient(client, validToken);
            expect(sseClient).toBeTruthy();

            // Send messages up to rate limit
            for (let i = 0; i < 1000; i++) {
                sseManager['sendToClient'](sseClient!, { type: 'test', data: i });
            }

            // Wait for rate limit window to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should be able to send messages again
            sseManager['sendToClient'](sseClient!, { type: 'test', data: 'new message' });
            const lastCall = client.send.mock.calls[client.send.mock.calls.length - 1][0];
            expect(JSON.parse(lastCall)).toMatchObject({
                type: 'test',
                data: 'new message'
            });
        });
    });

    describe('Event Broadcasting', () => {
        it('should only send events to authenticated clients', () => {
            const client1 = createTestClient('client1');
            const client2 = createTestClient('client2');

            const sseClient1 = sseManager.addClient(client1, validToken);
            jest.spyOn(TokenManager, 'validateToken').mockReturnValue({ valid: false });
            const sseClient2 = sseManager.addClient(client2, 'invalid_token');

            expect(sseClient1).toBeTruthy();
            expect(sseClient2).toBeNull();

            sseManager.broadcastEvent({
                event_type: 'test_event',
                data: { test: true },
                origin: 'test',
                time_fired: new Date().toISOString(),
                context: { id: 'test' }
            });

            expect(client1.send).toHaveBeenCalled();
            expect(client2.send).not.toHaveBeenCalled();
        });

        it('should respect subscription filters', () => {
            const client = createTestClient('test-client');
            const sseClient = sseManager.addClient(client, validToken);
            expect(sseClient).toBeTruthy();

            sseManager.subscribeToEvent(client.id, 'test_event');

            // Send matching event
            sseManager.broadcastEvent({
                event_type: 'test_event',
                data: { test: true },
                origin: 'test',
                time_fired: new Date().toISOString(),
                context: { id: 'test' }
            });

            // Send non-matching event
            sseManager.broadcastEvent({
                event_type: 'other_event',
                data: { test: true },
                origin: 'test',
                time_fired: new Date().toISOString(),
                context: { id: 'test' }
            });

            expect(client.send).toHaveBeenCalledTimes(1);
            const sentMessage = JSON.parse(client.send.mock.calls[0][0]);
            expect(sentMessage.type).toBe('test_event');
        });
    });
}); 