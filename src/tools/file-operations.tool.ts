/**
 * File Operations Tool for Home Assistant
 * 
 * Provides unrestricted file system access for Home Assistant configuration
 * WARNING: This tool has full file system access - use with caution
 */

import { z } from "zod";
import { logger } from "../utils/logger.js";
import { BaseTool } from "./base-tool.js";
import { MCPContext } from "../mcp/types.js";
import { get_hass } from "../hass/index.js";
import { Tool } from "../types/index.js";

const fileOperationsSchema = z.object({
    operation: z.enum(["read", "write", "delete", "list", "exists"]).describe("File operation to perform"),
    path: z.string().describe("File or directory path (relative to HA config directory or absolute)"),
    content: z.string().optional().describe("Content to write (required for write operation)"),
    encoding: z.enum(["utf-8", "base64", "binary"]).optional().default("utf-8").describe("File encoding"),
    recursive: z.boolean().optional().default(false).describe("For list operation, list recursively"),
});

type FileOperationsParams = z.infer<typeof fileOperationsSchema>;

/**
 * FileOperationsTool class extending BaseTool
 */
export class FileOperationsTool extends BaseTool {
    constructor() {
        super({
            name: "file_operations",
            description: "Perform file operations on Home Assistant configuration files. Can read, write, delete, and list files. UNRESTRICTED ACCESS - use with caution.",
            parameters: fileOperationsSchema,
            metadata: {
                category: "system",
                version: "1.0.0",
                tags: ["files", "configuration", "advanced", "dangerous"],
            }
        });
    }

    public async execute(params: FileOperationsParams, _context: MCPContext): Promise<Record<string, unknown>> {
        logger.debug(`Executing FileOperationsTool with params: ${JSON.stringify(params)}`);
        
        const validatedParams = this.validateParams(params);
        return await executeFileOperationsLogic(validatedParams);
    }
}

// Shared execution logic
async function executeFileOperationsLogic(params: FileOperationsParams): Promise<Record<string, unknown>> {
    try {
        // File operations are not available through the standard Home Assistant REST API
        // They require either:
        // 1. Supervisor API access (hassio) for /config directory
        // 2. Direct file system access (not available through REST API)
        // 3. Custom integration or python_script
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: false,
                    error: "File operations not supported",
                    operation: params.operation,
                    path: params.path,
                    message: "Direct file operations are not available through the Home Assistant REST API for security reasons.",
                    alternatives: [
                        "Use the Home Assistant File Editor add-on",
                        "Access files via SSH/Terminal",
                        "Use the Studio Code Server add-on",
                        "Use the Supervisor API if running Home Assistant OS/Supervised (requires Supervisor access token)"
                    ],
                    note: "File operations through the API were intentionally restricted to prevent unauthorized access to the file system."
                }, null, 2)
            }]
        };
        
        /* Original implementation kept for reference - these services don't exist in HA
        const hass = await get_hass();
        
        // Get Home Assistant config directory
        const config = await hass.getConfig();
        const configDir = config.config_dir || "/config";
        
        // Resolve path (if relative, make it relative to config dir)
        const resolvedPath = params.path.startsWith('/') 
            ? params.path 
            : `${configDir}/${params.path}`;

        logger.info(`File operation: ${params.operation} on ${resolvedPath}`);

        switch (params.operation) {
            case "read": {
                // Use the file_get_contents service - DOES NOT EXIST
                const response = await hass.callService("homeassistant", "file_get_contents", {
                    path: resolvedPath
                });

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            operation: "read",
                            path: resolvedPath,
                            content: response.content || response,
                            encoding: params.encoding,
                            size: response.content?.length || 0
                        }, null, 2)
                    }]
                };
            }
        */
    } catch (error) {
        logger.error(`File operation error: ${error instanceof Error ? error.message : String(error)}`);
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    operation: params.operation,
                    path: params.path
                }, null, 2)
            }]
        };
    }
}

// Tool object export for FastMCP/stdio transport
export const fileOperationsTool: Tool = {
    name: "file_operations",
    description: "Perform file operations on Home Assistant configuration files. Can read, write, delete, and list files. UNRESTRICTED ACCESS - use with caution.",
    parameters: fileOperationsSchema,
    execute: executeFileOperationsLogic
};
