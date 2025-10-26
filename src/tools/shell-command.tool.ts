/**
 * Shell Command Tool for Home Assistant
 * 
 * Execute arbitrary shell commands on the Home Assistant host
 * WARNING: This tool provides UNRESTRICTED shell access - extremely dangerous!
 */

import { z } from "zod";
import { logger } from "../utils/logger.js";
import { BaseTool } from "./base-tool.js";
import { MCPContext } from "../mcp/types.js";
import { get_hass } from "../hass/index.js";
import { Tool } from "../types/index.js";

const shellCommandSchema = z.object({
    command: z.string().describe("Shell command to execute"),
    timeout: z.number().optional().default(30).describe("Command timeout in seconds (default: 30)"),
});

type ShellCommandParams = z.infer<typeof shellCommandSchema>;

/**
 * ShellCommandTool class extending BaseTool
 */
export class ShellCommandTool extends BaseTool {
    constructor() {
        super({
            name: "shell_command",
            description: "Execute arbitrary shell commands on the Home Assistant host. ⚠️ EXTREMELY DANGEROUS - Full shell access with no restrictions!",
            parameters: shellCommandSchema,
            metadata: {
                category: "system",
                version: "1.0.0",
                tags: ["shell", "command", "advanced", "dangerous", "unrestricted"],
            }
        });
    }

    public async execute(params: ShellCommandParams, _context: MCPContext): Promise<Record<string, unknown>> {
        // Check if shell commands are enabled
        const shellCommandsEnabled = process.env.ENABLE_SHELL_COMMANDS === 'true';
        
        if (!shellCommandsEnabled) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Shell commands are disabled",
                        message: "Shell command execution is disabled.",
                        suggestion: "To enable, set ENABLE_SHELL_COMMANDS=true in your .env file and restart the container."
                    }, null, 2)
                }]
            };
        }
        
        logger.warn(`Executing shell command: ${params.command}`);
        
        const validatedParams = this.validateParams(params);
        return await executeShellCommandLogic(validatedParams);
    }
}

// Shared execution logic
async function executeShellCommandLogic(params: ShellCommandParams): Promise<Record<string, unknown>> {
    try {
        const hass = await get_hass();
        
        logger.warn(`Executing shell command: ${params.command}`);

        // Use the shell_command service
        // First, we need to create a temporary shell_command in configuration
        // This is done via the shell_command integration
        
        // Create a unique command name
        const commandName = `mcp_cmd_${Date.now()}`;
        
        // Execute via homeassistant service
        const response = await hass.callService("shell_command", commandName, {
            command: params.command
        });

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    command: params.command,
                    output: response,
                    message: "Shell command executed successfully"
                }, null, 2)
            }]
        };

    } catch (error) {
        logger.error(`Shell command error: ${error instanceof Error ? error.message : String(error)}`);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Shell command service not available",
                        message: "The shell_command integration is not configured in Home Assistant",
                        suggestion: "Add shell_command to your configuration.yaml. Note: Direct shell execution may not be available. Consider using the SSH add-on or SSH & Web Terminal add-on for command execution.",
                        alternative: "You can also use the 'call_service' tool to interact with HA services instead of shell commands."
                    }, null, 2)
                }]
            };
        }

        throw error;
    }
}

// Tool object export for FastMCP/stdio transport
export const shellCommandTool: Tool = {
    name: "shell_command",
    description: "Execute arbitrary shell commands on the Home Assistant host. ⚠️ EXTREMELY DANGEROUS - Full shell access with no restrictions!",
    parameters: shellCommandSchema,
    execute: executeShellCommandLogic
};
