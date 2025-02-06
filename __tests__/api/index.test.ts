import { describe, expect, test, mock, beforeEach } from "bun:test";
import express from 'express';
import request from 'supertest';
import { config } from 'dotenv';
import { resolve } from 'path';
import type { Entity } from '../../src/types/hass.js';
import { TokenManager } from '../../src/security/index.js';
import { MCP_SCHEMA } from '../../src/mcp/schema.js';

// Load test environment variables
void config({ path: resolve(process.cwd(), '.env.test') });

// Mock dependencies
mock.module('../../src/security/index.js', () => ({
    TokenManager: {
        validateToken: mock((token) => token === 'valid-test-token')
    },
    rateLimiter: (req: any, res: any, next: any) => next(),
    securityHeaders: (req: any, res: any, next: any) => next(),
    validateRequest: (req: any, res: any, next: any) => next(),
    sanitizeInput: (req: any, res: any, next: any) => next(),
    errorHandler: (err: any, req: any, res: any, next: any) => {
        res.status(500).json({ error: err.message });
    }
}));

// Create mock entity
const mockEntity: Entity = {
    entity_id: 'light.living_room',
    state: 'off',
    attributes: {},
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    context: {
        id: '123',
        parent_id: null,
        user_id: null
    }
};

// Mock LiteMCP
mock.module('litemcp', () => ({
    LiteMCP: mock(() => ({
        name: 'home-assistant',
        version: '0.1.0',
        tools: []
    }))
}));

// Create Express app for testing
const app = express();
app.use(express.json());

// Add test routes that mimic our actual routes
app.get('/mcp', (_req, res) => {
    res.json(MCP_SCHEMA);
});

app.get('/state', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== 'valid-test-token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json([mockEntity]);
});

app.post('/command', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== 'valid-test-token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { command, entity_id } = req.body;
    if (!command || !entity_id) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (command === 'invalid_command') {
        return res.status(400).json({ error: 'Invalid command' });
    }

    res.json({ success: true });
});

describe('API Endpoints', () => {
    describe('GET /mcp', () => {
        test('should return MCP schema without authentication', async () => {
            const response = await request(app)
                .get('/mcp')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toBeDefined();
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('tools');
        });
    });

    describe('Protected Endpoints', () => {
        describe('GET /state', () => {
            test('should return 401 without authentication', async () => {
                await request(app)
                    .get('/state')
                    .expect(401);
            });

            test('should return state with valid token', async () => {
                const response = await request(app)
                    .get('/state')
                    .set('Authorization', 'Bearer valid-test-token')
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toBeDefined();
                expect(Array.isArray(response.body)).toBeTruthy();
                expect(response.body[0]).toHaveProperty('entity_id', 'light.living_room');
                expect(response.body[0]).toHaveProperty('state', 'off');
            });
        });

        describe('POST /command', () => {
            test('should return 401 without authentication', async () => {
                await request(app)
                    .post('/command')
                    .send({
                        command: 'turn_on',
                        entity_id: 'light.living_room'
                    })
                    .expect(401);
            });

            test('should process valid command with authentication', async () => {
                const response = await request(app)
                    .post('/command')
                    .set('Authorization', 'Bearer valid-test-token')
                    .send({
                        command: 'turn_on',
                        entity_id: 'light.living_room'
                    })
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toBeDefined();
                expect(response.body).toHaveProperty('success', true);
            });

            test('should validate command parameters', async () => {
                await request(app)
                    .post('/command')
                    .set('Authorization', 'Bearer valid-test-token')
                    .send({
                        command: 'invalid_command',
                        entity_id: 'light.living_room'
                    })
                    .expect(400);
            });
        });
    });
}); 