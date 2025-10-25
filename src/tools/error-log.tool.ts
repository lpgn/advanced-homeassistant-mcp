/**
 * Error Log Tool for Home Assistant
 * 
 * Retrieves Home Assistant error logs for debugging
 */

import { z } from "zod";
import { logger } from "../utils/logger.js";
import { BaseTool } from "./base-tool.js";
import { MCPContext } from "../mcp/types.js";
import { get_hass } from "../hass/index.js";
import { Tool } from "../types/index.js";

const errorLogSchema = z.object({
    lines: z.number().optional().default(50).describe("Number of log lines to retrieve (default: 50)"),
    filter: z.string().optional().describe("Filter logs by keyword (e.g., 'error', 'warning', component name)"),
});

type ErrorLogParams = z.infer<typeof errorLogSchema>;

/**
 * ErrorLogTool class extending BaseTool
 */
export class ErrorLogTool extends BaseTool {
    constructor() {
        super({
            name: "get_error_log",
            description: "Get Home Assistant error logs for debugging. Useful for troubleshooting issues with automations, integrations, or entities.",
            parameters: errorLogSchema,
            metadata: {
                category: "system",
                version: "1.0.0",
                tags: ["logs", "errors", "debugging", "troubleshooting"],
            }
        });
    }

    public async execute(params: ErrorLogParams, _context: MCPContext): Promise<Record<string, unknown>> {
        logger.debug(`Executing ErrorLogTool with params: ${JSON.stringify(params)}`);
        
        const validatedParams = this.validateParams(params);
        return await executeErrorLogLogic(validatedParams);
    }
}

// Shared execution logic
async function executeErrorLogLogic(params: ErrorLogParams): Promise<Record<string, unknown>> {
    try {
        // Fetch error log directly from REST API endpoint
        const baseUrl = process.env.HASS_HOST || "http://localhost:8123";
        const token = process.env.HASS_TOKEN || "";
        
        const response = await fetch(`${baseUrl}/api/error_log`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "text/plain",
            },
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch error log: ${response.status} ${response.statusText}`);
        }
        
        const logText = await response.text();
        const logLines = logText.split('\n').filter(line => line.trim());
        
        if (!logLines || logLines.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        log_count: 0,
                        message: "No errors in log",
                        logs: []
                    }, null, 2)
                }]
            };
        }

        let logs = logLines;

        // Filter logs if keyword provided
        if (params.filter) {
            const filterLower = params.filter.toLowerCase();
            logs = logs.filter((line: string) => 
                line.toLowerCase().includes(filterLower)
            );
        }

        // Limit to requested number of lines
        const limitedLogs = logs.slice(-params.lines); // Get last N lines

        // Parse log lines to extract structured information
        const formattedLogs = limitedLogs.map((line: string) => {
            // Try to parse timestamp and level from log line
            const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
            const levelMatch = line.match(/(ERROR|WARNING|INFO|DEBUG|CRITICAL)/);
            
            return {
                timestamp: timestampMatch ? timestampMatch[1] : 'Unknown',
                level: levelMatch ? levelMatch[1] : 'UNKNOWN',
                message: line,
            };
        });

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    log_count: formattedLogs.length,
                    total_available: logs.length,
                    filter_applied: params.filter || null,
                    logs: formattedLogs
                }, null, 2)
            }]
        };

    } catch (error) {
        logger.error(`Error retrieving error logs: ${error instanceof Error ? error.message : String(error)}`);
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    message: "Failed to retrieve error logs. The error_log API endpoint may not be accessible.",
                    suggestion: "Check that your Home Assistant instance is running and accessible, and that the long-lived access token has the correct permissions."
                }, null, 2)
            }]
        };
    }
}

// Tool object export for FastMCP/stdio transport
export const errorLogTool: Tool = {
    name: "get_error_log",
    description: "Get Home Assistant error logs for debugging. Useful for troubleshooting issues with automations, integrations, or entities.",
    parameters: errorLogSchema,
    execute: executeErrorLogLogic
};
