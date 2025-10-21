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
                // Use the file_get_contents service
                const response = await hass.callService("homeassistant", "file_get_contents", {
                    path: resolvedPath
                });

                return {
                    success: true,
                    operation: "read",
                    path: resolvedPath,
                    content: response.content || response,
                    encoding: params.encoding,
                    size: response.content?.length || 0
                };
            }

            case "write": {
                if (!params.content) {
                    return {
                        success: false,
                        error: "Content is required for write operation"
                    };
                }

                // Use the file_write service
                await hass.callService("homeassistant", "file_write", {
                    path: resolvedPath,
                    content: params.content,
                    encoding: params.encoding
                });

                return {
                    success: true,
                    operation: "write",
                    path: resolvedPath,
                    bytes_written: params.content.length,
                    encoding: params.encoding
                };
            }

            case "delete": {
                // Use the file_delete service
                await hass.callService("homeassistant", "file_delete", {
                    path: resolvedPath
                });

                return {
                    success: true,
                    operation: "delete",
                    path: resolvedPath
                };
            }

            case "list": {
                // Use the file_list service
                const response = await hass.callService("homeassistant", "file_list", {
                    path: resolvedPath,
                    recursive: params.recursive
                });

                return {
                    success: true,
                    operation: "list",
                    path: resolvedPath,
                    files: response.files || response,
                    count: Array.isArray(response.files) ? response.files.length : 0
                };
            }

            case "exists": {
                try {
                    await hass.callService("homeassistant", "file_get_contents", {
                        path: resolvedPath
                    });
                    return {
                        success: true,
                        operation: "exists",
                        path: resolvedPath,
                        exists: true
                    };
                } catch (error) {
                    return {
                        success: true,
                        operation: "exists",
                        path: resolvedPath,
                        exists: false
                    };
                }
            }

            default:
                return {
                    success: false,
                    error: `Unknown operation: ${params.operation}`
                };
        }

    } catch (error) {
        logger.error(`File operation error: ${error instanceof Error ? error.message : String(error)}`);
        
        // Provide helpful error messages
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            return {
                success: false,
                error: "File or directory not found",
                path: params.path,
                message: "The specified path does not exist"
            };
        }

        if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
            return {
                success: false,
                error: "Permission denied",
                path: params.path,
                message: "Home Assistant does not have permission to access this file"
            };
        }

        if (errorMessage.includes('service') && errorMessage.includes('not found')) {
            return {
                success: false,
                error: "File operations not available",
                message: "The required Home Assistant services (file_get_contents, file_write, etc.) are not available",
                suggestion: "These services were added in Home Assistant 2021.6. Please update your installation or use the python_script integration for file operations."
            };
        }

        throw error;
    }
}

// Tool object export for FastMCP/stdio transport
export const fileOperationsTool: Tool = {
    name: "file_operations",
    description: "Perform file operations on Home Assistant configuration files. Can read, write, delete, and list files. UNRESTRICTED ACCESS - use with caution.",
    parameters: fileOperationsSchema,
    execute: executeFileOperationsLogic
};
