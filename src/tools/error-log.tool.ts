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
        const hass = await get_hass();
        
        // Call the system_log/list service to get error logs
        const response = await hass.callService("system_log", "list", {});
        
        if (!response || !Array.isArray(response)) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Unable to retrieve error logs",
                        message: "The system_log service may not be available"
                    }, null, 2)
                }]
            };
        }

        let logs = response;

        // Filter logs if keyword provided
        if (params.filter) {
            const filterLower = params.filter.toLowerCase();
            logs = logs.filter((log: any) => {
                const message = (log.message || '').toLowerCase();
                const name = (log.name || '').toLowerCase();
                const level = (log.level || '').toLowerCase();
                return message.includes(filterLower) || 
                       name.includes(filterLower) || 
                       level.includes(filterLower);
            });
        }

        // Limit to requested number of lines
        const limitedLogs = logs.slice(0, params.lines);

        // Format logs for readability
        const formattedLogs = limitedLogs.map((log: any) => ({
            timestamp: log.timestamp || 'Unknown',
            level: log.level || 'INFO',
            source: log.name || 'Unknown',
            message: log.message || '',
            exception: log.exception || null,
            count: log.count || 1
        }));

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
        
        // If system_log service is not available, try to read from file
        try {
            const hass = await get_hass();
            const configDir = await hass.callService("homeassistant", "get_config", {});
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Direct log access not available through API",
                        message: "Try checking the logs in Home Assistant UI (Settings > System > Logs) or access the log file directly",
                        config_directory: configDir,
                        suggestion: "Enable the system_log integration if not already enabled"
                    }, null, 2)
                }]
            };
        } catch {
            throw error;
        }
    }
}

// Tool object export for FastMCP/stdio transport
export const errorLogTool: Tool = {
    name: "get_error_log",
    description: "Get Home Assistant error logs for debugging. Useful for troubleshooting issues with automations, integrations, or entities.",
    parameters: errorLogSchema,
    execute: executeErrorLogLogic
};
