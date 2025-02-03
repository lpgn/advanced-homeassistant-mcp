import { Router } from 'express';
import { MCP_SCHEMA } from '../mcp/schema.js';
import { APP_CONFIG } from '../config/app.config.js';
import { Tool } from '../types/index.js';

const router = Router();

// Array to track tools
const tools: Tool[] = [];

// MCP schema endpoint - no auth required as it's just the schema
router.get('/', (_req, res) => {
    res.json(MCP_SCHEMA);
});

// MCP execute endpoint - requires authentication
router.post('/execute', async (req, res) => {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token || token !== APP_CONFIG.HASS_TOKEN) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Invalid token'
            });
        }

        const { tool: toolName, parameters } = req.body;

        // Find the requested tool
        const tool = tools.find(t => t.name === toolName);
        if (!tool) {
            return res.status(404).json({
                success: false,
                message: `Tool '${toolName}' not found`
            });
        }

        // Execute the tool with the provided parameters
        const result = await tool.execute(parameters);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

export { router as mcpRoutes }; 