import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import router from '../../../src/ai/endpoints/ai-router.js';
import type { AIResponse, AIError } from '../../../src/ai/types/index.js';

// Mock NLPProcessor
// // jest.mock('../../../src/ai/nlp/processor.js', () => {
    return {
        NLPProcessor: mock().mockImplementation(() => ({
            processCommand: mock().mockImplementation(async () => ({
                intent: {
                    action: 'turn_on',
                    target: 'light.living_room',
                    parameters: {}
                },
                confidence: {
                    overall: 0.9,
                    intent: 0.95,
                    entities: 0.85,
                    context: 0.9
                }
            })),
            validateIntent: mock().mockImplementation(async () => true),
            suggestCorrections: mock().mockImplementation(async () => [
                'Try using simpler commands',
                'Specify the device name clearly'
            ])
        }))
    };
});

describe('AI Router', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/ai', router);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /ai/interpret', () => {
        const validRequest = {
            input: 'turn on the living room lights',
            context: {
                user_id: 'test_user',
                session_id: 'test_session',
                timestamp: new Date().toISOString(),
                location: 'home',
                previous_actions: [],
                environment_state: {}
            },
            model: 'claude' as const
        };

        test('should successfully interpret a valid command', async () => {
            const response = await request(app)
                .post('/ai/interpret')
                .send(validRequest);

            expect(response.status).toBe(200);
            const body = response.body as AIResponse;
            expect(typeof body.natural_language).toBe('string');
            expect(body.structured_data).toEqual(expect.objectContaining({
                success: true,
                action_taken: 'turn_on',
                entities_affected: ['light.living_room'],
                state_changes: expect.any(Object)
            }));
            expect(Array.isArray(body.next_suggestions)).toBe(true);
            expect(body.confidence).toEqual(expect.objectContaining({
                overall: expect.any(Number),
                intent: expect.any(Number),
                entities: expect.any(Number),
                context: expect.any(Number)
            }));
            expect(body.context).toBeDefined();
        });

        test('should handle invalid input format', async () => {
            const response = await request(app)
                .post('/ai/interpret')
                .send({
                    input: 123, // Invalid input type
                    context: validRequest.context
                });

            expect(response.status).toBe(500);
            const error = response.body.error as AIError;
            expect(error.code).toBe('PROCESSING_ERROR');
            expect(typeof error.message).toBe('string');
            expect(typeof error.suggestion).toBe('string');
            expect(Array.isArray(error.recovery_options)).toBe(true);
        });

        test('should handle missing required fields', async () => {
            const response = await request(app)
                .post('/ai/interpret')
                .send({
                    input: 'turn on the lights'
                    // Missing context
                });

            expect(response.status).toBe(500);
            const error = response.body.error as AIError;
            expect(error.code).toBe('PROCESSING_ERROR');
            expect(typeof error.message).toBe('string');
        });

        test('should handle rate limiting', async () => {
            // Make multiple requests to trigger rate limiting
            const requests = Array(101).fill(validRequest);
            const responses = await Promise.all(
                requests.map(() =>
                    request(app)
                        .post('/ai/interpret')
                        .send(validRequest)
                )
            );

            const rateLimitedResponses = responses.filter(r => r.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('POST /ai/execute', () => {
        const validRequest = {
            intent: {
                action: 'turn_on',
                target: 'light.living_room',
                parameters: {}
            },
            context: {
                user_id: 'test_user',
                session_id: 'test_session',
                timestamp: new Date().toISOString(),
                location: 'home',
                previous_actions: [],
                environment_state: {}
            },
            model: 'claude' as const
        };

        test('should successfully execute a valid intent', async () => {
            const response = await request(app)
                .post('/ai/execute')
                .send(validRequest);

            expect(response.status).toBe(200);
            const body = response.body as AIResponse;
            expect(typeof body.natural_language).toBe('string');
            expect(body.structured_data).toEqual(expect.objectContaining({
                success: true,
                action_taken: 'turn_on',
                entities_affected: ['light.living_room'],
                state_changes: expect.any(Object)
            }));
            expect(Array.isArray(body.next_suggestions)).toBe(true);
            expect(body.confidence).toEqual(expect.objectContaining({
                overall: expect.any(Number),
                intent: expect.any(Number),
                entities: expect.any(Number),
                context: expect.any(Number)
            }));
            expect(body.context).toBeDefined();
        });

        test('should handle invalid intent format', async () => {
            const response = await request(app)
                .post('/ai/execute')
                .send({
                    intent: {
                        action: 123 // Invalid action type
                    },
                    context: validRequest.context
                });

            expect(response.status).toBe(500);
            const error = response.body.error as AIError;
            expect(error.code).toBe('PROCESSING_ERROR');
            expect(typeof error.message).toBe('string');
        });
    });

    describe('GET /ai/suggestions', () => {
        const validRequest = {
            context: {
                user_id: 'test_user',
                session_id: 'test_session',
                timestamp: new Date().toISOString(),
                location: 'home',
                previous_actions: [],
                environment_state: {}
            },
            model: 'claude' as const
        };

        test('should return a list of suggestions', async () => {
            const response = await request(app)
                .get('/ai/suggestions')
                .send(validRequest);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.suggestions)).toBe(true);
            expect(response.body.suggestions.length).toBeGreaterThan(0);
        });

        test('should handle missing context', async () => {
            const response = await request(app)
                .get('/ai/suggestions')
                .send({});

            expect(response.status).toBe(500);
            const error = response.body.error as AIError;
            expect(error.code).toBe('PROCESSING_ERROR');
            expect(typeof error.message).toBe('string');
        });
    });
}); 