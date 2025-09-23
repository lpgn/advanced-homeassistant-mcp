/**
 * Climate Control Tool for Home Assistant (fastmcp format)
 *
 * This tool allows controlling climate devices (thermostats, AC units, etc.)
 * in Home Assistant through the MCP. It supports modes, temperature settings,
 * and fan modes.
 */

import { z } from "zod";
import { logger } from "../../utils/logger.js";
import type { FastMCPTool } from "fastmcp"; // Assuming FastMCPTool type exists
import { BaseTool } from "../base-tool.js";
import { MCPContext } from "../../mcp/types.js";

// Mock Home Assistant API service in absence of actual HA integration
class MockHAClimateService {
    private climateDevices: Map<string, {
        state: "on" | "off";
        hvac_mode: "off" | "heat" | "cool" | "auto" | "dry" | "fan_only";
        temperature?: number;
        target_temp_high?: number;
        target_temp_low?: number;
        fan_mode?: "auto" | "low" | "medium" | "high";
        friendly_name: string;
        supported_features: string[];
        current_temperature?: number;
        humidity?: number;
    }>;

    constructor() {
        // Initialize with some mock climate devices
        this.climateDevices = new Map([
            ["climate.living_room", {
                state: "on",
                hvac_mode: "cool",
                temperature: 72,
                fan_mode: "auto",
                friendly_name: "Living Room Thermostat",
                supported_features: ["target_temperature", "fan_mode"],
                current_temperature: 75
            }],
            ["climate.bedroom", {
                state: "off",
                hvac_mode: "off",
                temperature: 68,
                fan_mode: "low",
                friendly_name: "Bedroom Thermostat",
                supported_features: ["target_temperature", "fan_mode"],
                current_temperature: 70
            }],
            ["climate.kitchen", {
                state: "on",
                hvac_mode: "heat",
                temperature: 70,
                fan_mode: "medium",
                friendly_name: "Kitchen Thermostat",
                supported_features: ["target_temperature", "fan_mode"],
                current_temperature: 68,
                humidity: 45
            }],
            ["climate.office", {
                state: "on",
                hvac_mode: "auto",
                target_temp_high: 78,
                target_temp_low: 70,
                fan_mode: "auto",
                friendly_name: "Office Thermostat",
                supported_features: ["target_temperature_range", "fan_mode"],
                current_temperature: 72,
                humidity: 40
            }]
        ]);
    }

    // Get all climate devices
    public getClimateDevices(): Record<string, unknown>[] {
        const result = [];
        for (const [entity_id, device] of this.climateDevices.entries()) {
            result.push({
                entity_id,
                state: device.state,
                attributes: {
                    ...device,
                    friendly_name: device.friendly_name
                }
            });
        }
        return result;
    }

    // Get a specific climate device
    public getClimateDevice(entity_id: string): Record<string, unknown> | null {
        const device = this.climateDevices.get(entity_id);
        if (!device) {
            return null;
        }

        return {
            entity_id,
            state: device.state,
            attributes: {
                ...device,
                friendly_name: device.friendly_name
            }
        };
    }

    // Set HVAC mode
    public setHVACMode(entity_id: string, hvac_mode: string): boolean {
        const device = this.climateDevices.get(entity_id);
        if (!device) {
            return false;
        }

        // Validate mode
        if (!["off", "heat", "cool", "auto", "dry", "fan_only"].includes(hvac_mode)) {
            return false;
        }

        // Set mode
        device.hvac_mode = hvac_mode as any;

        // Update state based on mode
        device.state = hvac_mode === "off" ? "off" : "on";

        this.climateDevices.set(entity_id, device);
        return true;
    }

    // Set temperature
    public setTemperature(
        entity_id: string,
        temperature?: number,
        target_temp_high?: number,
        target_temp_low?: number
    ): boolean {
        const device = this.climateDevices.get(entity_id);
        if (!device) {
            return false;
        }

        // Single temperature setting
        if (temperature !== undefined &&
            device.supported_features.includes("target_temperature")) {
            device.temperature = temperature;
            // Clear range if single temp is set?
            // device.target_temp_high = undefined;
            // device.target_temp_low = undefined;
        }

        // Temperature range setting
        if (target_temp_high !== undefined &&
            target_temp_low !== undefined &&
            device.supported_features.includes("target_temperature_range")) {
            device.target_temp_high = target_temp_high;
            device.target_temp_low = target_temp_low;
            // Clear single temp if range is set?
            // device.temperature = undefined;
        }

        this.climateDevices.set(entity_id, device);
        return true;
    }

    // Set fan mode
    public setFanMode(entity_id: string, fan_mode: string): boolean {
        const device = this.climateDevices.get(entity_id);
        if (!device) {
            return false;
        }

        // Validate fan mode
        if (!["auto", "low", "medium", "high"].includes(fan_mode)) {
            return false;
        }

        // Check if fan mode is supported
        if (!device.supported_features.includes("fan_mode")) {
            return false;
        }

        // Set fan mode
        device.fan_mode = fan_mode as any;

        this.climateDevices.set(entity_id, device);
        return true;
    }
}

// Singleton instance
const haClimateService = new MockHAClimateService();

// Define the schema for our tool parameters using Zod
const climateControlSchema = z.object({
    action: z.enum(["list", "get", "set_hvac_mode", "set_temperature", "set_fan_mode"])
        .describe("The action to perform on the climate device"),
    entity_id: z.string()
        .optional()
        .describe("The entity ID of the climate device (required for get and set actions)"),
    hvac_mode: z.enum(["off", "heat", "cool", "auto", "dry", "fan_only"])
        .optional()
        .describe("The HVAC mode to set (required for set_hvac_mode)"),
    temperature: z.number()
        .optional()
        .describe("The target temperature to set (use for single setpoint devices)"),
    target_temp_high: z.number()
        .optional()
        .describe("The maximum target temperature for range devices (use with target_temp_low)"),
    target_temp_low: z.number()
        .optional()
        .describe("The minimum target temperature for range devices (use with target_temp_high)"),
    fan_mode: z.enum(["auto", "low", "medium", "high"])
        .optional()
        .describe("The fan mode to set (required for set_fan_mode)"),
});

// Infer the type from the schema
type ClimateControlParams = z.infer<typeof climateControlSchema>;

// --- Shared Execution Logic ---
async function executeClimateControlLogic(params: ClimateControlParams): Promise<Record<string, unknown>> {
    let success: boolean;
    let deviceDetails: Record<string, unknown> | null;

    switch (params.action) {
        case "list":
            const devices = haClimateService.getClimateDevices();
            return { devices };

        case "get":
            if (!params.entity_id) {
                throw new Error("entity_id is required for 'get' action");
            }
            deviceDetails = haClimateService.getClimateDevice(params.entity_id);
            if (!deviceDetails) {
                throw new Error(`Climate entity_id '${params.entity_id}' not found.`);
            }
            return deviceDetails;

        case "set_hvac_mode":
            if (!params.entity_id) {
                throw new Error("entity_id is required for 'set_hvac_mode' action");
            }
            if (!params.hvac_mode) {
                throw new Error("hvac_mode is required for 'set_hvac_mode' action");
            }
            success = haClimateService.setHVACMode(params.entity_id, params.hvac_mode);
            if (!success) {
                 throw new Error(`Failed to set HVAC mode for '${params.entity_id}'. Entity not found or mode not supported?`);
            }
            deviceDetails = haClimateService.getClimateDevice(params.entity_id);
            return { status: "success", state: deviceDetails };

         case "set_temperature":
            if (!params.entity_id) {
                throw new Error("entity_id is required for 'set_temperature' action");
            }
            if (params.temperature === undefined && params.target_temp_high === undefined && params.target_temp_low === undefined) {
                 throw new Error("At least one temperature parameter (temperature, target_temp_high, target_temp_low) is required for 'set_temperature' action");
            }
            if ((params.target_temp_high !== undefined && params.target_temp_low === undefined) || (params.target_temp_high === undefined && params.target_temp_low !== undefined)){
                 throw new Error("Both target_temp_high and target_temp_low must be provided together for temperature range setting");
            }

            success = haClimateService.setTemperature(
                params.entity_id,
                params.temperature,
                params.target_temp_high,
                params.target_temp_low
            );
             if (!success) {
                 throw new Error(`Failed to set temperature for '${params.entity_id}'. Entity not found or temperature setting not supported?`);
            }
            deviceDetails = haClimateService.getClimateDevice(params.entity_id);
            return { status: "success", state: deviceDetails };

        case "set_fan_mode":
             if (!params.entity_id) {
                throw new Error("entity_id is required for 'set_fan_mode' action");
            }
            if (!params.fan_mode) {
                throw new Error("fan_mode is required for 'set_fan_mode' action");
            }
            success = haClimateService.setFanMode(params.entity_id, params.fan_mode);
             if (!success) {
                 throw new Error(`Failed to set fan mode for '${params.entity_id}'. Entity not found or mode not supported?`);
            }
            deviceDetails = haClimateService.getClimateDevice(params.entity_id);
            return { status: "success", state: deviceDetails };

        default:
            throw new Error(`Unknown action: ${String(params.action)}`);
    }
}

// --- FastMCP Tool Definition ---
export const climateControlTool: FastMCPTool<ClimateControlParams, string | Record<string, unknown>> = {
    name: "climate_control",
    description: "Control climate devices (thermostats, AC) in Home Assistant",
    parameters: climateControlSchema,

    /**
     * Execute the tool logic
     * @param params - Validated parameters matching the schema
     * @param context - Session context (includes session object in fastmcp)
     * @returns A string confirming success or an object with climate device details
     */
    execute: async (params, context) => {
        logger.debug(`Executing climate_control (fastmcp) with params: ${JSON.stringify(params)}`);
        try {
            const result = await executeClimateControlLogic(params);
            return result;
        } catch (error) {
            logger.error(`Error in climate_control tool (fastmcp): ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    },
};

// --- Original BaseTool Class Definition (for compatibility with src/index.ts) ---
export class ClimateControlTool extends BaseTool {
    constructor() {
        super({
            name: climateControlTool.name, // Reuse name from fastmcp definition
            description: climateControlTool.description, // Reuse description
            parameters: climateControlSchema, // Reuse schema
            metadata: {
                category: "home_assistant", // Keep original metadata if needed
                version: "1.0.0",
                tags: ["climate", "thermostat", "hvac", "home_assistant"],
                // Add examples if BaseTool/MCPServer uses them
            }
        });
    }

    /**
     * Execute method for the BaseTool class
     */
    public async execute(params: ClimateControlParams, context: MCPContext): Promise<Record<string, unknown>> {
         logger.debug(`Executing ClimateControlTool (BaseTool) with params: ${JSON.stringify(params)}`);
        try {
            const validatedParams = this.validateParams(params);
            const result = await executeClimateControlLogic(validatedParams);
            // return this.validateResult(result); // Optional result validation
            return result;
        } catch (error) {
            logger.error(`Error in ClimateControlTool (BaseTool): ${String(error)}`);
            throw error;
        }
    }
}