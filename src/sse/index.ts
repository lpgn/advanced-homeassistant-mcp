import { EventEmitter } from 'events';
import { HassEntity, HassEvent } from '../interfaces/hass.js';
import { TokenManager } from '../security/index.js';

// Constants
const DEFAULT_MAX_CLIENTS = 1000;
const DEFAULT_PING_INTERVAL = 30000; // 30 seconds
const DEFAULT_CLEANUP_INTERVAL = 60000; // 1 minute
const DEFAULT_MAX_CONNECTION_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface RateLimit {
    count: number;
    lastReset: number;
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
}

export class SSEManager extends EventEmitter {
    private clients: Map<string, SSEClient> = new Map();
    private static instance: SSEManager | null = null;
    private entityStates: Map<string, HassEntity> = new Map();
    private readonly maxClients: number;
    private readonly pingInterval: number;
    private readonly cleanupInterval: number;
    private readonly maxConnectionAge: number;

    constructor(options: {
        maxClients?: number;
        pingInterval?: number;
        cleanupInterval?: number;
        maxConnectionAge?: number;
    } = {}) {
        super();
        this.maxClients = options.maxClients || DEFAULT_MAX_CLIENTS;
        this.pingInterval = options.pingInterval || DEFAULT_PING_INTERVAL;
        this.cleanupInterval = options.cleanupInterval || DEFAULT_CLEANUP_INTERVAL;
        this.maxConnectionAge = options.maxConnectionAge || DEFAULT_MAX_CONNECTION_AGE;

        console.log('Initializing SSE Manager...');
        this.startMaintenanceTasks();
    }

    private startMaintenanceTasks(): void {
        // Send periodic pings to keep connections alive
        setInterval(() => {
            this.clients.forEach(client => {
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

    addClient(client: Omit<SSEClient, 'authenticated' | 'subscriptions'>, token: string): SSEClient | null {
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
            lastPingAt: new Date()
        };

        this.clients.set(client.id, newClient);
        console.log(`New client ${client.id} connected from IP ${client.ip}`);

        return newClient;
    }

    private startClientPing(clientId: string) {
        const interval = setInterval(() => {
            const client = this.clients.get(clientId);
            if (!client) {
                clearInterval(interval);
                return;
            }

            this.sendToClient(client, {
                type: 'ping',
                timestamp: new Date().toISOString()
            });
        }, this.pingInterval);
    }

    removeClient(clientId: string) {
        if (this.clients.has(clientId)) {
            this.clients.delete(clientId);
            console.log(`SSE client disconnected: ${clientId}`);
            this.emit('client_disconnected', {
                clientId,
                timestamp: new Date().toISOString()
            });
        }
    }

    subscribeToEntity(clientId: string, entityId: string) {
        const client = this.clients.get(clientId);
        if (client?.authenticated) {
            client.subscriptions.add(`entity:${entityId}`);
            console.log(`Client ${clientId} subscribed to entity: ${entityId}`);

            // Send current state if available
            const currentState = this.entityStates.get(entityId);
            if (currentState) {
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
    }

    subscribeToDomain(clientId: string, domain: string) {
        const client = this.clients.get(clientId);
        if (client?.authenticated) {
            client.subscriptions.add(`domain:${domain}`);
            console.log(`Client ${clientId} subscribed to domain: ${domain}`);
        }
    }

    subscribeToEvent(clientId: string, eventType: string) {
        const client = this.clients.get(clientId);
        if (client?.authenticated) {
            client.subscriptions.add(`event:${eventType}`);
            console.log(`Client ${clientId} subscribed to event: ${eventType}`);
        }
    }

    broadcastStateChange(entity: HassEntity) {
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
        for (const client of this.clients.values()) {
            if (!client.authenticated) continue;

            if (
                client.subscriptions.has(`entity:${entity.entity_id}`) ||
                client.subscriptions.has(`domain:${domain}`) ||
                client.subscriptions.has('event:state_changed')
            ) {
                this.sendToClient(client, message);
            }
        }
    }

    broadcastEvent(event: HassEvent) {
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
        for (const client of this.clients.values()) {
            if (!client.authenticated) continue;

            if (client.subscriptions.has(`event:${event.event_type}`)) {
                this.sendToClient(client, message);
            }
        }
    }

    private sendToClient(client: SSEClient, data: any) {
        try {
            // Check rate limit
            const now = Date.now();
            if (now - client.rateLimit.lastReset > this.cleanupInterval) {
                client.rateLimit.count = 0;
                client.rateLimit.lastReset = now;
            }

            if (client.rateLimit.count >= 1000) {
                console.warn(`Rate limit exceeded for client ${client.id}`);
                this.sendToClient(client, {
                    type: 'error',
                    error: 'rate_limit_exceeded',
                    message: 'Too many requests, please try again later',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            client.rateLimit.count++;
            client.lastPingAt = new Date();
            client.send(JSON.stringify(data));
        } catch (error) {
            console.error(`Error sending message to client ${client.id}:`, error);
            this.removeClient(client.id);
        }
    }

    private validateToken(token?: string): boolean {
        if (!token) return false;
        const validationResult = TokenManager.validateToken(token);
        return validationResult.valid;
    }

    // Utility methods
    getConnectedClients(): number {
        return this.clients.size;
    }

    getClientSubscriptions(clientId: string) {
        return this.clients.get(clientId)?.subscriptions;
    }

    getEntityState(entityId: string): HassEntity | undefined {
        return this.entityStates.get(entityId);
    }

    // Add new event types
    broadcastServiceCall(domain: string, service: string, data: any) {
        const message = {
            type: 'service_called',
            data: {
                domain,
                service,
                service_data: data
            },
            timestamp: new Date().toISOString()
        };

        this.broadcastToSubscribers('service_called', message);
    }

    broadcastAutomationTriggered(automationId: string, trigger: any) {
        const message = {
            type: 'automation_triggered',
            data: {
                automation_id: automationId,
                trigger
            },
            timestamp: new Date().toISOString()
        };

        this.broadcastToSubscribers('automation_triggered', message);
    }

    broadcastScriptExecuted(scriptId: string, data: any) {
        const message = {
            type: 'script_executed',
            data: {
                script_id: scriptId,
                execution_data: data
            },
            timestamp: new Date().toISOString()
        };

        this.broadcastToSubscribers('script_executed', message);
    }

    private broadcastToSubscribers(eventType: string, message: any) {
        for (const client of this.clients.values()) {
            if (!client.authenticated) continue;

            if (client.subscriptions.has(`event:${eventType}`) ||
                client.subscriptions.has(`entity:${eventType}`) ||
                client.subscriptions.has(`domain:${eventType.split('.')[0]}`)) {
                this.sendToClient(client, message);
            }
        }
    }

    // Add statistics methods
    getStatistics(): {
        totalClients: number;
        authenticatedClients: number;
        clientStats: ClientStats[];
        subscriptionStats: { [key: string]: number };
    } {
        const now = Date.now();
        const clientStats: ClientStats[] = [];
        const subscriptionCounts: { [key: string]: number } = {};

        this.clients.forEach(client => {
            // Collect client statistics
            clientStats.push({
                id: client.id,
                ip: client.ip,
                connectedAt: client.connectedAt,
                lastPingAt: client.lastPingAt,
                subscriptionCount: client.subscriptions.size,
                connectionDuration: now - client.connectedAt.getTime()
            });

            // Count subscriptions by type
            client.subscriptions.forEach(sub => {
                const [type] = sub.split(':');
                subscriptionCounts[type] = (subscriptionCounts[type] || 0) + 1;
            });
        });

        return {
            totalClients: this.clients.size,
            authenticatedClients: Array.from(this.clients.values()).filter(c => c.authenticated).length,
            clientStats,
            subscriptionStats: subscriptionCounts
        };
    }
}

export const sseManager = SSEManager.getInstance(); 