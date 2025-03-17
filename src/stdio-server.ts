/**
 * MCP Server with stdio transport
 * 
 * This module provides a standalone MCP server that communicates
 * over standard input/output using JSON-RPC 2.0 protocol.
 */

// Only force silent logging if not in Cursor compatibility mode
if (!process.env.CURSOR_COMPATIBLE) {
    process.env.LOG_LEVEL = 'silent';
}

import { createStdioServer, BaseTool } from "./mcp/index.js";
import { z } from "zod";
import { logger } from "./utils/logger.js";
import { MCPContext } from "./mcp/types.js";

// Import Home Assistant tools
import { LightsControlTool } from './tools/homeassistant/lights.tool.js';
import { ClimateControlTool } from './tools/homeassistant/climate.tool.js';

// Check for Cursor compatibility mode
const isCursorMode = process.env.CURSOR_COMPATIBLE === 'true';
// Use silent startup except in Cursor mode
const silentStartup = !isCursorMode;
const debugMode = process.env.DEBUG_STDIO === 'true';

// Configure raw I/O handling if necessary
if (isCursorMode) {
    // Ensure stdout doesn't buffer for Cursor
    process.stdout.setDefaultEncoding('utf8');
    // Only try to set raw mode if it's a TTY and the method exists
    if (process.stdout.isTTY && typeof (process.stdout as any).setRawMode === 'function') {
        (process.stdout as any).setRawMode(true);
    }
}

// Send a notification directly to stdout for compatibility
function sendNotification(method: string, params: any): void {
    const notification = {
        jsonrpc: '2.0',
        method,
        params
    };
    const message = JSON.stringify(notification) + '\n';
    process.stdout.write(message);

    // For Cursor mode, ensure messages are flushed if method exists
    if (isCursorMode && typeof (process.stdout as any).flush === 'function') {
        (process.stdout as any).flush();
    }
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

        // Send initial notifications BEFORE server initialization for Cursor compatibility
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

        // Start the server after initial notifications
        await server.start();

        // In Cursor mode, send notifications again after startup
        if (isCursorMode) {
            // Small delay to ensure all messages are processed
            setTimeout(() => {
                // Send system info again
                sendNotification('system.info', {
                    name: 'Home Assistant Model Context Protocol Server',
                    version: '1.0.0',
                    transport: 'stdio',
                    protocol: 'json-rpc-2.0',
                    features: ['streaming'],
                    timestamp: new Date().toISOString()
                });

                // Send available tools again
                sendNotification('tools.available', {
                    tools: toolDefinitions
                });
            }, 100);
        }

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