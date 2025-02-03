import { EventEmitter } from 'events';
import { HassEntity, HassEvent } from '../interfaces/hass.js';
import { TokenManager } from '../security/index.js';

// Constants
const DEFAULT_MAX_CLIENTS = 1000;
const DEFAULT_PING_INTERVAL = 30000; // 30 seconds
const DEFAULT_CLEANUP_INTERVAL = 60000; // 1 minute
const DEFAULT_MAX_CONNECTION_AGE = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_RATE_LIMIT = {
    MAX_MESSAGES: 100, // messages
    WINDOW_MS: 60000,  // 1 minute
    BURST_LIMIT: 10    // max messages per second
};

interface RateLimit {
    count: number;
    lastReset: number;
    burstCount: number;
    lastBurstReset: number;
}

export interface SSEClient {
    id: string;
    ip: string;
    connectedAt: Date;
    lastPingAt?: Date;
    subscriptions: Set<string>;
    authenticated: boolean;
    send: (data: string) => void;
    rateLimit: RateLimit;
    connectionTime: number;
}

interface ClientStats {
    id: string;
    ip: string;
    connectedAt: Date;
    lastPingAt?: Date;
    subscriptionCount: number;
    connectionDuration: number;
    messagesSent: number;
    lastActivity: Date;
}

export class SSEManager extends EventEmitter {
    private clients: Map<string, SSEClient> = new Map();
    private static instance: SSEManager | null = null;
    private entityStates: Map<string, HassEntity> = new Map();
    private readonly maxClients: number;
    private readonly pingInterval: number;
    private readonly cleanupInterval: number;
    private readonly maxConnectionAge: number;
    private readonly rateLimit: typeof DEFAULT_RATE_LIMIT;

    constructor(options: {
        maxClients?: number;
        pingInterval?: number;
        cleanupInterval?: number;
        maxConnectionAge?: number;
        rateLimit?: Partial<typeof DEFAULT_RATE_LIMIT>;
    } = {}) {
        super();
        this.maxClients = options.maxClients || DEFAULT_MAX_CLIENTS;
        this.pingInterval = options.pingInterval || DEFAULT_PING_INTERVAL;
        this.cleanupInterval = options.cleanupInterval || DEFAULT_CLEANUP_INTERVAL;
        this.maxConnectionAge = options.maxConnectionAge || DEFAULT_MAX_CONNECTION_AGE;
        this.rateLimit = { ...DEFAULT_RATE_LIMIT, ...options.rateLimit };

        console.log('Initializing SSE Manager...');
        this.startMaintenanceTasks();
    }

    private startMaintenanceTasks(): void {
        // Send periodic pings to keep connections alive
        setInterval(() => {
            this.clients.forEach(client => {
                if (!this.isRateLimited(client)) {
                    try {
                        client.send(JSON.stringify({
                            type: 'ping',
                            timestamp: new Date().toISOString()
                        }));
                        client.lastPingAt = new Date();
                    } catch (error) {
                        console.error(`Failed to ping client ${client.id}:`, error);
                        this.removeClient(client.id);
                    }
                }
            });
        }, this.pingInterval);

        // Cleanup inactive or expired connections
        setInterval(() => {
            const now = Date.now();
            this.clients.forEach((client, clientId) => {
                const connectionAge = now - client.connectedAt.getTime();
                const lastPingAge = client.lastPingAt ? now - client.lastPingAt.getTime() : 0;

                if (connectionAge > this.maxConnectionAge || lastPingAge > this.pingInterval * 2) {
                    console.log(`Removing inactive client ${clientId}`);
                    this.removeClient(clientId);
                }
            });
        }, this.cleanupInterval);
    }

    static getInstance(): SSEManager {
        if (!SSEManager.instance) {
            SSEManager.instance = new SSEManager();
        }
        return SSEManager.instance;
    }

    addClient(client: Omit<SSEClient, 'authenticated' | 'subscriptions' | 'rateLimit'>, token: string): SSEClient | null {
        // Validate token
        const validationResult = TokenManager.validateToken(token, client.ip);
        if (!validationResult.valid) {
            console.warn(`Invalid token for client ${client.id} from IP ${client.ip}: ${validationResult.error}`);
            return null;
        }

        // Check client limit
        if (this.clients.size >= this.maxClients) {
            console.warn(`Maximum client limit (${this.maxClients}) reached`);
            return null;
        }

        // Create new client with authentication and subscriptions
        const newClient: SSEClient = {
            ...client,
            authenticated: true,
            subscriptions: new Set(),
            lastPingAt: new Date(),
            rateLimit: {
                count: 0,
                lastReset: Date.now(),
                burstCount: 0,
                lastBurstReset: Date.now()
            }
        };

        this.clients.set(client.id, newClient);
        console.log(`New client ${client.id} connected from IP ${client.ip}`);

        return newClient;
    }

    private isRateLimited(client: SSEClient): boolean {
        const now = Date.now();

        // Reset window counters if needed
        if (now - client.rateLimit.lastReset >= this.rateLimit.WINDOW_MS) {
            client.rateLimit.count = 0;
            client.rateLimit.lastReset = now;
        }

        // Reset burst counters if needed (every second)
        if (now - client.rateLimit.lastBurstReset >= 1000) {
            client.rateLimit.burstCount = 0;
            client.rateLimit.lastBurstReset = now;
        }

        // Check both window and burst limits
        return (
            client.rateLimit.count >= this.rateLimit.MAX_MESSAGES ||
            client.rateLimit.burstCount >= this.rateLimit.BURST_LIMIT
        );
    }

    private updateRateLimit(client: SSEClient): void {
        const now = Date.now();
        client.rateLimit.count++;
        client.rateLimit.burstCount++;

        // Update timestamps if needed
        if (now - client.rateLimit.lastReset >= this.rateLimit.WINDOW_MS) {
            client.rateLimit.lastReset = now;
            client.rateLimit.count = 1;
        }

        if (now - client.rateLimit.lastBurstReset >= 1000) {
            client.rateLimit.lastBurstReset = now;
            client.rateLimit.burstCount = 1;
        }
    }

    removeClient(clientId: string): void {
        if (this.clients.has(clientId)) {
            this.clients.delete(clientId);
            console.log(`SSE client disconnected: ${clientId}`);
            this.emit('client_disconnected', {
                clientId,
                timestamp: new Date().toISOString()
            });
        }
    }

    subscribeToEntity(clientId: string, entityId: string): void {
        const client = this.clients.get(clientId);
        if (!client?.authenticated) {
            console.warn(`Unauthenticated client ${clientId} attempted to subscribe to entity: ${entityId}`);
            return;
        }

        client.subscriptions.add(`entity:${entityId}`);
        console.log(`Client ${clientId} subscribed to entity: ${entityId}`);

        // Send current state if available
        const currentState = this.entityStates.get(entityId);
        if (currentState && !this.isRateLimited(client)) {
            this.sendToClient(client, {
                type: 'state_changed',
                data: {
                    entity_id: currentState.entity_id,
                    state: currentState.state,
                    attributes: currentState.attributes,
                    last_changed: currentState.last_changed,
                    last_updated: currentState.last_updated
                }
            });
        }
    }

    subscribeToDomain(clientId: string, domain: string): void {
        const client = this.clients.get(clientId);
        if (!client?.authenticated) {
            console.warn(`Unauthenticated client ${clientId} attempted to subscribe to domain: ${domain}`);
            return;
        }

        client.subscriptions.add(`domain:${domain}`);
        console.log(`Client ${clientId} subscribed to domain: ${domain}`);
    }

    subscribeToEvent(clientId: string, eventType: string): void {
        const client = this.clients.get(clientId);
        if (!client?.authenticated) {
            console.warn(`Unauthenticated client ${clientId} attempted to subscribe to event: ${eventType}`);
            return;
        }

        client.subscriptions.add(`event:${eventType}`);
        console.log(`Client ${clientId} subscribed to event: ${eventType}`);
    }

    broadcastStateChange(entity: HassEntity): void {
        // Update stored state
        this.entityStates.set(entity.entity_id, entity);

        const domain = entity.entity_id.split('.')[0];
        const message = {
            type: 'state_changed',
            data: {
                entity_id: entity.entity_id,
                state: entity.state,
                attributes: entity.attributes,
                last_changed: entity.last_changed,
                last_updated: entity.last_updated
            },
            timestamp: new Date().toISOString()
        };

        console.log(`Broadcasting state change for ${entity.entity_id}`);

        // Send to relevant subscribers only
        this.clients.forEach(client => {
            if (!client.authenticated || this.isRateLimited(client)) return;

            if (
                client.subscriptions.has(`entity:${entity.entity_id}`) ||
                client.subscriptions.has(`domain:${domain}`) ||
                client.subscriptions.has('event:state_changed')
            ) {
                this.sendToClient(client, message);
            }
        });
    }

    broadcastEvent(event: HassEvent): void {
        const message = {
            type: event.event_type,
            data: event.data,
            origin: event.origin,
            time_fired: event.time_fired,
            context: event.context,
            timestamp: new Date().toISOString()
        };

        console.log(`Broadcasting event: ${event.event_type}`);

        // Send to relevant subscribers only
        this.clients.forEach(client => {
            if (!client.authenticated || this.isRateLimited(client)) return;

            if (client.subscriptions.has(`event:${event.event_type}`)) {
                this.sendToClient(client, message);
            }
        });
    }

    private sendToClient(client: SSEClient, data: unknown): void {
        try {
            if (!client.authenticated) {
                console.warn(`Attempted to send message to unauthenticated client ${client.id}`);
                return;
            }

            if (this.isRateLimited(client)) {
                console.warn(`Rate limit exceeded for client ${client.id}`);
                return;
            }

            const message = typeof data === 'string' ? data : JSON.stringify(data);
            client.send(message);
            this.updateRateLimit(client);
        } catch (error) {
            console.error(`Failed to send message to client ${client.id}:`, error);
            this.removeClient(client.id);
        }
    }

    getStatistics(): {
        totalClients: number;
        authenticatedClients: number;
        clientStats: ClientStats[];
        subscriptionStats: { [key: string]: number };
    } {
        const now = Date.now();
        const clientStats: ClientStats[] = [];
        const subscriptionStats: { [key: string]: number } = {};
        let authenticatedClients = 0;

        this.clients.forEach(client => {
            if (client.authenticated) {
                authenticatedClients++;
            }

            clientStats.push({
                id: client.id,
                ip: client.ip,
                connectedAt: client.connectedAt,
                lastPingAt: client.lastPingAt,
                subscriptionCount: client.subscriptions.size,
                connectionDuration: now - client.connectedAt.getTime(),
                messagesSent: client.rateLimit.count,
                lastActivity: new Date(client.rateLimit.lastReset)
            });

            client.subscriptions.forEach(sub => {
                subscriptionStats[sub] = (subscriptionStats[sub] || 0) + 1;
            });
        });

        return {
            totalClients: this.clients.size,
            authenticatedClients,
            clientStats,
            subscriptionStats
        };
    }
}

export const sseManager = SSEManager.getInstance(); 