/**
 * MCP Server with stdio transport
 * 
 * This module provides a standalone MCP server that communicates
 * over standard input/output using JSON-RPC 2.0 protocol.
 */

// Force silent logging
process.env.LOG_LEVEL = 'silent';

import { createStdioServer, BaseTool } from "./mcp/index.js";
import { z } from "zod";
import { logger } from "./utils/logger.js";
import { MCPContext } from "./mcp/types.js";

// Import Home Assistant tools
import { LightsControlTool } from './tools/homeassistant/lights.tool.js';
import { ClimateControlTool } from './tools/homeassistant/climate.tool.js';

// Check for silent startup mode - never silent in npx mode to ensure the JSON-RPC messages are sent
const silentStartup = true;
const debugMode = process.env.DEBUG_STDIO === 'true';

// Send a notification directly to stdout for Cursor compatibility
function sendNotification(method: string, params: any): void {
    const notification = {
        jsonrpc: '2.0',
        method,
        params
    };
    process.stdout.write(JSON.stringify(notification) + '\n');
}

// Create system tools
class InfoTool extends BaseTool {
    constructor() {
        super({
            name: "system_info",
            description: "Get information about the Home Assistant MCP server",
            parameters: z.object({}).optional(),
            metadata: {
                category: "system",
                version: "1.0.0",
                tags: ["system", "info"]
            }
        });
    }

    execute(_params: any, _context: MCPContext): any {
        return {
            version: "1.0.0",
            name: "Home Assistant MCP Server",
            mode: "stdio",
            transport: "json-rpc-2.0",
            features: ["streaming", "middleware", "validation"],
            timestamp: new Date().toISOString(),
            homeAssistant: {
                available: true,
                toolCount: 2,
                toolNames: ["lights_control", "climate_control"]
            }
        };
    }
}

async function main() {
    try {
        // Create system tools
        const systemTools = [
            new InfoTool()
        ];

        // Create Home Assistant tools
        const haTools = [
            new LightsControlTool(),
            new ClimateControlTool()
        ];

        // Combine all tools
        const allTools = [...systemTools, ...haTools];

        // Create server with stdio transport
        const { server, transport } = createStdioServer({
            silent: silentStartup,
            debug: debugMode,
            tools: allTools
        });

        // Explicitly set the server reference to ensure access to tools
        if ('setServer' in transport && typeof transport.setServer === 'function') {
            transport.setServer(server);
        }

        // Send initial notifications directly to stdout for Cursor compatibility
        // Send system info
        sendNotification('system.info', {
            name: 'Home Assistant Model Context Protocol Server',
            version: '1.0.0',
            transport: 'stdio',
            protocol: 'json-rpc-2.0',
            features: ['streaming'],
            timestamp: new Date().toISOString()
        });

        // Send available tools
        const toolDefinitions = allTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: {
                type: "object",
                properties: {},
                required: []
            },
            metadata: tool.metadata
        }));

        sendNotification('tools.available', {
            tools: toolDefinitions
        });

        // Start the server
        await server.start();

        // Handle process exit
        process.on('SIGINT', async () => {
            await server.shutdown();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await server.shutdown();
            process.exit(0);
        });

        // Keep process alive
        process.stdin.resume();
    } catch (error) {
        logger.error("Error starting Home Assistant MCP stdio server:", error);
        process.exit(1);
    }
}

// Run the main function
main().catch(error => {
    logger.error("Uncaught error:", error);
    process.exit(1);
}); 