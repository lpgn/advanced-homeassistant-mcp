import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sseManager } from '../sse/index.js';
import { TokenManager } from '../security/index.js';

const router = Router();

// SSE endpoints
router.get('/subscribe', (req, res) => {
    try {
        // Get token from query parameter
        const token = req.query.token?.toString();

        if (!token || !TokenManager.validateToken(token)) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Invalid token'
            });
        }

        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Send initial connection message
        res.write(`data: ${JSON.stringify({
            type: 'connection',
            status: 'connected',
            timestamp: new Date().toISOString()
        })}\n\n`);

        const clientId = uuidv4();
        const client = {
            id: clientId,
            send: (data: string) => {
                res.write(`data: ${data}\n\n`);
            }
        };

        // Add client to SSE manager
        const sseClient = sseManager.addClient(client, token);
        if (!sseClient || !sseClient.authenticated) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                message: sseClient ? 'Authentication failed' : 'Maximum client limit reached',
                timestamp: new Date().toISOString()
            })}\n\n`);
            return res.end();
        }

        // Subscribe to events if specified
        const events = req.query.events?.toString().split(',').filter(Boolean);
        if (events?.length) {
            events.forEach(event => sseManager.subscribeToEvent(clientId, event));
        }

        // Subscribe to entity if specified
        const entityId = req.query.entity_id?.toString();
        if (entityId) {
            sseManager.subscribeToEntity(clientId, entityId);
        }

        // Subscribe to domain if specified
        const domain = req.query.domain?.toString();
        if (domain) {
            sseManager.subscribeToDomain(clientId, domain);
        }

        // Handle client disconnect
        req.on('close', () => {
            sseManager.removeClient(clientId);
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// Get SSE stats endpoint
router.get('/stats', async (req, res) => {
    try {
        const stats = await sseManager.getStatistics();
        res.json(stats);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

export { router as sseRoutes }; 