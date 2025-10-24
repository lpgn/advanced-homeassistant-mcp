/**
 * Generic Service Call Tool for Home Assistant
 * 
 * Allows calling any Home Assistant service with parameters
 */

import { z } from "zod";
import { logger } from "../utils/logger.js";
import { BaseTool } from "./base-tool.js";
import { MCPContext } from "../mcp/types.js";
import { get_hass } from "../hass/index.js";
import { Tool } from "../types/index.js";

const callServiceSchema = z.object({
    domain: z.string().describe("Service domain (e.g., 'light', 'switch', 'homeassistant')"),
    service: z.string().describe("Service name (e.g., 'turn_on', 'turn_off', 'reload_config_entry')"),
    service_data: z.record(z.any()).optional().describe("Service parameters as key-value pairs"),
    entity_id: z.union([z.string(), z.array(z.string())]).optional().describe("Target entity ID(s)"),
    target: z.object({
        entity_id: z.union([z.string(), z.array(z.string())]).optional(),
        device_id: z.union([z.string(), z.array(z.string())]).optional(),
        area_id: z.union([z.string(), z.array(z.string())]).optional(),
    }).optional().describe("Advanced targeting options")
});

type CallServiceParams = z.infer<typeof callServiceSchema>;

/**
 * CallServiceTool class extending BaseTool
 */
export class CallServiceTool extends BaseTool {
    constructor() {
        super({
            name: "call_service",
            description: "Call any Home Assistant service with custom parameters. This is a powerful generic tool for advanced operations not covered by specialized tools.",
            parameters: callServiceSchema,
            metadata: {
                category: "advanced",
                version: "1.0.0",
                tags: ["service", "generic", "advanced", "flexible"],
            }
        });
    }

    public async execute(params: CallServiceParams, _context: MCPContext): Promise<Record<string, unknown>> {
        logger.debug(`Executing CallServiceTool with params: ${JSON.stringify(params)}`);
        
        const validatedParams = this.validateParams(params);
        return await executeCallServiceLogic(validatedParams);
    }
}

// Shared execution logic
async function executeCallServiceLogic(params: CallServiceParams): Promise<Record<string, unknown>> {
    try {
        const hass = await get_hass();

        // Build service data object
        const serviceData: Record<string, any> = {
            ...(params.service_data || {})
        };

        // Add entity_id if provided
        if (params.entity_id) {
            serviceData.entity_id = params.entity_id;
        }

        // Add target if provided
        if (params.target) {
            serviceData.target = params.target;
        }

        logger.info(`Calling service: ${params.domain}.${params.service}`, { serviceData });

        // Call the service
        const response = await hass.callService(params.domain, params.service, serviceData);

        // Check if we have a context ID (indicates successful service call)
        const success = response && (response.context || response.success !== false);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: success,
                    service: `${params.domain}.${params.service}`,
                    service_data: serviceData,
                    response: response || { message: "Service called successfully" },
                    message: success 
                        ? `Successfully called ${params.domain}.${params.service}`
                        : "Service call completed but response format is unexpected"
                }, null, 2)
            }]
        };

    } catch (error) {
        logger.error(`Error calling service: ${error instanceof Error ? error.message : String(error)}`);
        
        // Provide helpful error messages for common issues
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Service ${params.domain}.${params.service} not found`,
                        message: "Please check the domain and service name are correct",
                        suggestion: "Use 'list services' or check Home Assistant Developer Tools > Services for available services"
                    }, null, 2)
                }]
            };
        }

        if (errorMessage.includes('required') || errorMessage.includes('missing')) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Missing required parameters",
                        message: errorMessage,
                        suggestion: "Check the service documentation for required parameters"
                    }, null, 2)
                }]
            };
        }

        throw error;
    }
}

// Tool object export for FastMCP/stdio transport
export const callServiceTool: Tool = {
    name: "call_service",
    description: "Call any Home Assistant service with custom parameters. This is a powerful generic tool for advanced operations not covered by specialized tools.",
    parameters: callServiceSchema,
    execute: executeCallServiceLogic
};
