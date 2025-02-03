export class LiteMCP {
    name: string;
    version: string;
    config: any;

    constructor(config: any = {}) {
        this.name = 'home-assistant';
        this.version = '1.0.0';
        this.config = config;
    }

    async start() {
        return Promise.resolve();
    }

    async stop() {
        return Promise.resolve();
    }

    async connect() {
        return Promise.resolve();
    }

    async disconnect() {
        return Promise.resolve();
    }

    async callService(domain: string, service: string, data: any = {}) {
        return Promise.resolve({ success: true });
    }

    async getStates() {
        return Promise.resolve([]);
    }

    async getState(entityId: string) {
        return Promise.resolve({
            entity_id: entityId,
            state: 'unknown',
            attributes: {},
            last_changed: new Date().toISOString(),
            last_updated: new Date().toISOString()
        });
    }

    async setState(entityId: string, state: string, attributes: any = {}) {
        return Promise.resolve({ success: true });
    }

    onStateChanged(callback: (event: any) => void) {
        // Mock implementation
    }

    onEvent(eventType: string, callback: (event: any) => void) {
        // Mock implementation
    }
}

export const createMCP = (config: any = {}) => {
    return new LiteMCP(config);
}; 