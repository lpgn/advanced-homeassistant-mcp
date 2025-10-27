/**
 * System Management Tool for Home Assistant
 * 
 * Provides system-level management operations
 */

import { z } from "zod";
import { logger } from "../utils/logger.js";
import { BaseTool } from "./base-tool.js";
import { MCPContext } from "../mcp/types.js";
import { get_hass } from "../hass/index.js";
import { Tool } from "../types/index.js";

const systemManagementSchema = z.object({
    action: z.enum([
        "restart",
        "stop",
        "reload_core_config",
        "reload_all",
        "reload_automation",
        "reload_script",
        "reload_scene",
        "reload_group",
        "reload_template",
        "check_config",
        "set_location",
        "update_entity",
        "remove_entity"
    ]).describe("System management action to perform"),
    params: z.record(z.any()).optional().describe("Additional parameters for the action"),
});

type SystemManagementParams = z.infer<typeof systemManagementSchema>;

/**
 * SystemManagementTool class extending BaseTool
 */
export class SystemManagementTool extends BaseTool {
    constructor() {
        super({
            name: "system_management",
            description: "Perform system-level operations on Home Assistant including restart, reload configurations, and system updates. ⚠️ Can disrupt HA operations!",
            parameters: systemManagementSchema,
            metadata: {
                category: "system",
                version: "1.0.0",
                tags: ["system", "management", "configuration"],
            }
        });
    }

    public async execute(params: SystemManagementParams, _context: MCPContext): Promise<Record<string, unknown>> {
        // Check if system management operations are enabled
        const systemRestartEnabled = process.env.ENABLE_SYSTEM_RESTART === 'true';
        const supervisorAccess = process.env.ALLOW_SUPERVISOR_ACCESS === 'true';
        
        // Restart and stop require explicit permission
        const requiresRestart = params.action === 'restart' || params.action === 'stop';
        
        if (requiresRestart && !systemRestartEnabled) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "System restart/stop operations are disabled",
                        message: "Home Assistant restart and stop operations are disabled. Reload operations may still work.",
                        suggestion: "To enable, set ENABLE_SYSTEM_RESTART=true in your .env file and restart the container."
                    }, null, 2)
                }]
            };
        }
        
        logger.info(`Executing SystemManagementTool: ${params.action}`);
        
        const validatedParams = this.validateParams(params);
        return await executeSystemManagementLogic(validatedParams);
    }
}

// Shared execution logic
async function executeSystemManagementLogic(params: SystemManagementParams): Promise<Record<string, unknown>> {
    try {
        const hass = await get_hass();
        
        logger.warn(`⚠️  System management action: ${params.action}`);

        let response: any;
        let serviceDomain = "homeassistant";
        let serviceName = params.action;

        // Map actions to appropriate services
        switch (params.action) {
            case "restart":
                serviceDomain = "homeassistant";
                serviceName = "restart";
                logger.warn("🔄 RESTARTING HOME ASSISTANT - This will disconnect all clients!");
                break;

            case "stop":
                serviceDomain = "homeassistant";
                serviceName = "stop";
                logger.warn("🛑 STOPPING HOME ASSISTANT - This will shut down the system!");
                break;

            case "reload_core_config":
                serviceDomain = "homeassistant";
                serviceName = "reload_core_config";
                break;

            case "reload_all":
                serviceDomain = "homeassistant";
                serviceName = "reload_all";
                break;

            case "reload_automation":
                serviceDomain = "automation";
                serviceName = "reload";
                break;

            case "reload_script":
                serviceDomain = "script";
                serviceName = "reload";
                break;

            case "reload_scene":
                serviceDomain = "scene";
                serviceName = "reload";
                break;

            case "reload_group":
                serviceDomain = "group";
                serviceName = "reload";
                break;

            case "reload_template":
                serviceDomain = "template";
                serviceName = "reload";
                break;

            case "check_config":
                serviceDomain = "homeassistant";
                serviceName = "check_config";
                break;

            case "set_location":
                serviceDomain = "homeassistant";
                serviceName = "set_location";
                break;

            case "update_entity":
                serviceDomain = "homeassistant";
                serviceName = "update_entity";
                break;

            case "remove_entity":
                serviceDomain = "homeassistant";
                serviceName = "remove_entity";
                break;
        }

        // Execute the service
        response = await hass.callService(serviceDomain, serviceName, params.params || {});

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    action: params.action,
                    service: `${serviceDomain}.${serviceName}`,
                    response: response,
                    message: `Successfully executed ${params.action}`,
                    warning: ["restart", "stop"].includes(params.action) 
                        ? "Home Assistant is restarting/stopping - connection will be lost"
                        : undefined
                }, null, 2)
            }]
        };

    } catch (error) {
        logger.error(`System management error: ${error instanceof Error ? error.message : String(error)}`);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Service not available for action: ${params.action}`,
                        message: "The requested system management service is not available",
                        suggestion: "Check that the required integration is loaded in Home Assistant"
                    }, null, 2)
                }]
            };
        }

        if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Permission denied",
                        message: "The Home Assistant token does not have permission for this system operation",
                        suggestion: "Ensure the token has administrator privileges"
                    }, null, 2)
                }]
            };
        }

        throw error;
    }
}

// Tool object export for FastMCP/stdio transport
export const systemManagementTool: Tool = {
    name: "system_management",
    description: "Perform system-level operations on Home Assistant including restart, reload configurations, and system updates. ⚠️ Can disrupt HA operations!",
    parameters: systemManagementSchema,
    execute: executeSystemManagementLogic
};
