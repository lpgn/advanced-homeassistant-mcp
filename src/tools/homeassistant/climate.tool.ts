/**
 * Climate Control Tool for Home Assistant
 * 
 * This tool allows controlling climate devices (thermostats, AC units, etc.) 
 * in Home Assistant through the MCP. It supports modes, temperature settings,
 * and fan modes.
 */

import { z } from "zod";
import { BaseTool } from "../base-tool.js";
import { logger } from "../../utils/logger.js";
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
        }

        // Temperature range setting
        if (target_temp_high !== undefined &&
            target_temp_low !== undefined &&
            device.supported_features.includes("target_temperature_range")) {
            device.target_temp_high = target_temp_high;
            device.target_temp_low = target_temp_low;
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

// Define the schema for our tool parameters
const climateControlSchema = z.object({
    action: z.enum(["list", "get", "set_hvac_mode", "set_temperature", "set_fan_mode"]).describe("The action to perform"),
    entity_id: z.string().optional().describe("The entity ID of the climate device to control"),
    hvac_mode: z.enum(["off", "heat", "cool", "auto", "dry", "fan_only"]).optional().describe("The HVAC mode to set"),
    temperature: z.number().optional().describe("The target temperature to set"),
    target_temp_high: z.number().optional().describe("The maximum target temperature to set"),
    target_temp_low: z.number().optional().describe("The minimum target temperature to set"),
    fan_mode: z.enum(["auto", "low", "medium", "high"]).optional().describe("The fan mode to set"),
});

type ClimateControlParams = z.infer<typeof climateControlSchema>;

/**
 * Tool for controlling climate devices in Home Assistant
 */
export class ClimateControlTool extends BaseTool {
    constructor() {
        super({
            name: "climate_control",
            description: "Control climate devices in Home Assistant",
            parameters: climateControlSchema,
            metadata: {
                category: "home_assistant",
                version: "1.0.0",
                tags: ["climate", "thermostat", "hvac", "home_assistant"],
                examples: [
                    {
                        description: "List all climate devices",
                        params: { action: "list" }
                    },
                    {
                        description: "Set temperature",
                        params: {
                            action: "set_temperature",
                            entity_id: "climate.living_room",
                            temperature: 72
                        }
                    }
                ]
            }
        });
    }

    /**
     * Execute the tool
     */
    public async execute(params: ClimateControlParams, context: MCPContext): Promise<Record<string, unknown>> {
        logger.debug(`Executing ClimateControlTool with params: ${JSON.stringify(params)}`);

        try {
            // Add an await here to satisfy the linter
            await Promise.resolve();

            switch (params.action) {
                case "list":
                    return this.listClimateDevices();

                case "get":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for get action");
                    }
                    return this.getClimateDevice(params.entity_id);

                case "set_hvac_mode":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for set_hvac_mode action");
                    }
                    if (!params.hvac_mode) {
                        throw new Error("hvac_mode is required for set_hvac_mode action");
                    }
                    return this.setHVACMode(params.entity_id, params.hvac_mode);

                case "set_temperature":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for set_temperature action");
                    }
                    if (params.temperature === undefined &&
                        (params.target_temp_high === undefined || params.target_temp_low === undefined)) {
                        throw new Error("Either temperature or both target_temp_high and target_temp_low are required");
                    }
                    return this.setTemperature(
                        params.entity_id,
                        params.temperature,
                        params.target_temp_high,
                        params.target_temp_low
                    );

                case "set_fan_mode":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for set_fan_mode action");
                    }
                    if (!params.fan_mode) {
                        throw new Error("fan_mode is required for set_fan_mode action");
                    }
                    return this.setFanMode(params.entity_id, params.fan_mode);

                default:
                    throw new Error(`Unknown action: ${String(params.action)}`);
            }
        } catch (error) {
            logger.error(`Error in ClimateControlTool: ${String(error)}`);
            throw error;
        }
    }

    /**
     * List all climate devices
     */
    private listClimateDevices(): Record<string, unknown> {
        const devices = haClimateService.getClimateDevices();

        return {
            success: true,
            climate_devices: devices,
            count: devices.length
        };
    }

    /**
     * Get a specific climate device
     */
    private getClimateDevice(entity_id: string): Record<string, unknown> {
        const device = haClimateService.getClimateDevice(entity_id);

        if (!device) {
            return {
                success: false,
                error: `Climate device ${entity_id} not found`
            };
        }

        return {
            success: true,
            device
        };
    }

    /**
     * Set HVAC mode
     */
    private setHVACMode(entity_id: string, hvac_mode: string): Record<string, unknown> {
        const success = haClimateService.setHVACMode(entity_id, hvac_mode);

        if (!success) {
            return {
                success: false,
                error: `Failed to set HVAC mode for ${entity_id}: device not found or mode not supported`
            };
        }

        const device = haClimateService.getClimateDevice(entity_id);

        return {
            success: true,
            message: `Set HVAC mode to ${hvac_mode} for ${entity_id}`,
            device
        };
    }

    /**
     * Set temperature
     */
    private setTemperature(
        entity_id: string,
        temperature?: number,
        target_temp_high?: number,
        target_temp_low?: number
    ): Record<string, unknown> {
        const success = haClimateService.setTemperature(
            entity_id,
            temperature,
            target_temp_high,
            target_temp_low
        );

        if (!success) {
            return {
                success: false,
                error: `Failed to set temperature for ${entity_id}: device not found or feature not supported`
            };
        }

        const device = haClimateService.getClimateDevice(entity_id);
        const tempMessage = temperature !== undefined
            ? `temperature to ${temperature}°`
            : `temperature range to ${target_temp_low}° - ${target_temp_high}°`;

        return {
            success: true,
            message: `Set ${tempMessage} for ${entity_id}`,
            device
        };
    }

    /**
     * Set fan mode
     */
    private setFanMode(entity_id: string, fan_mode: string): Record<string, unknown> {
        const success = haClimateService.setFanMode(entity_id, fan_mode);

        if (!success) {
            return {
                success: false,
                error: `Failed to set fan mode for ${entity_id}: device not found or mode not supported`
            };
        }

        const device = haClimateService.getClimateDevice(entity_id);

        return {
            success: true,
            message: `Set fan mode to ${fan_mode} for ${entity_id}`,
            device
        };
    }
} 