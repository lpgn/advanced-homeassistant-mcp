/**
 * Lights Control Tool for Home Assistant (fastmcp format)
 *
 * This tool allows controlling lights in Home Assistant through the MCP.
 * It supports turning lights on/off, changing brightness, color, and color temperature.
 */

import { z } from "zod";
import { logger } from "../../utils/logger.js";
import type { FastMCPTool } from "fastmcp"; // Assuming FastMCPTool type exists
// Re-import BaseTool and MCPContext for the class definition
import { BaseTool } from "../base-tool.js";
import { MCPContext } from "../../mcp/types.js";

// Mock Home Assistant API service in absence of actual HA integration
class MockHALightsService {
    private lights: Map<string, {
        state: "on" | "off";
        brightness?: number;
        color_temp?: number;
        rgb_color?: [number, number, number];
        friendly_name: string;
    }>;

    constructor() {
        // Initialize with some mock lights
        this.lights = new Map([
            ["light.living_room", {
                state: "off",
                brightness: 255,
                friendly_name: "Living Room Light"
            }],
            ["light.kitchen", {
                state: "on",
                brightness: 200,
                friendly_name: "Kitchen Light"
            }],
            ["light.bedroom", {
                state: "off",
                brightness: 150,
                color_temp: 400,
                friendly_name: "Bedroom Light"
            }],
            ["light.office", {
                state: "on",
                brightness: 255,
                rgb_color: [255, 255, 255],
                friendly_name: "Office Light"
            }]
        ]);
    }

    // Get all lights
    public getLights(): Record<string, unknown>[] {
        const result = [];
        for (const [entity_id, light] of this.lights.entries()) {
            result.push({
                entity_id,
                state: light.state,
                attributes: {
                    ...light,
                    friendly_name: light.friendly_name
                }
            });
        }
        return result;
    }

    // Get a specific light
    public getLight(entity_id: string): Record<string, unknown> | null {
        const light = this.lights.get(entity_id);
        if (!light) {
            return null;
        }

        return {
            entity_id,
            state: light.state,
            attributes: {
                ...light,
                friendly_name: light.friendly_name
            }
        };
    }

    // Turn a light on
    public turnOn(entity_id: string, attributes: Record<string, unknown> = {}): boolean {
        const light = this.lights.get(entity_id);
        if (!light) {
            return false;
        }

        light.state = "on";

        // Apply attributes
        if (typeof attributes.brightness === "number") {
            light.brightness = Math.max(0, Math.min(255, attributes.brightness));
        }

        if (typeof attributes.color_temp === "number") {
            light.color_temp = Math.max(153, Math.min(500, attributes.color_temp));
        }

        if (Array.isArray(attributes.rgb_color) && attributes.rgb_color.length >= 3) {
            // Individually extract and validate each RGB component
            const r = Number(attributes.rgb_color[0]);
            const g = Number(attributes.rgb_color[1]);
            const b = Number(attributes.rgb_color[2]);

            // Only set if we got valid numbers
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                light.rgb_color = [
                    Math.max(0, Math.min(255, r)),
                    Math.max(0, Math.min(255, g)),
                    Math.max(0, Math.min(255, b))
                ];
            }
        }

        this.lights.set(entity_id, light);
        return true;
    }

    // Turn a light off
    public turnOff(entity_id: string): boolean {
        const light = this.lights.get(entity_id);
        if (!light) {
            return false;
        }

        light.state = "off";
        this.lights.set(entity_id, light);
        return true;
    }
}

// Singleton instance
const haLightsService = new MockHALightsService();

// Define the schema for our tool parameters using Zod
const lightsControlSchema = z.object({
    action: z.enum(["list", "get", "turn_on", "turn_off"]).describe("The action to perform"),
    entity_id: z.string().optional().describe("The entity ID of the light to control (required for get, turn_on, turn_off)"),
    brightness: z.number().min(0).max(255).optional().describe("Brightness level (0-255)"),
    color_temp: z.number().min(153).max(500).optional().describe("Color temperature in Mireds (153-500)"),
    rgb_color: z.tuple([
        z.number().min(0).max(255),
        z.number().min(0).max(255),
        z.number().min(0).max(255)
    ]).optional().describe("RGB color as [r, g, b] (0-255 each)"),
});

// Infer the type from the schema
type LightsControlParams = z.infer<typeof lightsControlSchema>;

// Define the tool using the FastMCP structure
export const lightsControlTool: FastMCPTool<LightsControlParams, string | Record<string, unknown>> = {
    name: "lights_control",
    description: "Control lights in Home Assistant (list, get, turn_on, turn_off)",
    parameters: lightsControlSchema, // Use the Zod schema directly
    // Add metadata if fastmcp supports it, otherwise omit or place in description
    // metadata: { ... }

    /**
     * Execute the tool logic
     * @param params - Validated parameters matching the schema
     * @param context - Session context (includes session object in fastmcp)
     * @returns A string confirming success or an object with light details
     */
    execute: async (params, context) => { // context might contain session info in fastmcp
        logger.debug(`Executing lights_control with params: ${JSON.stringify(params)}`);
        // logger.debug(`Session context: ${JSON.stringify(context)}`); // Log context if needed

        try {
            let attributes: Record<string, unknown>;
            let success: boolean;
            let lightDetails: Record<string, unknown> | null;

            switch (params.action) {
                case "list":
                    const lights = haLightsService.getLights();
                    return { lights }; // Return the list of lights

                case "get":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for 'get' action");
                    }
                    lightDetails = haLightsService.getLight(params.entity_id);
                    if (!lightDetails) {
                        throw new Error(`Light entity_id '${params.entity_id}' not found.`);
                    }
                    return lightDetails; // Return details of the specific light

                case "turn_on":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for 'turn_on' action");
                    }
                    attributes = {};
                    if (params.brightness !== undefined) attributes.brightness = params.brightness;
                    if (params.color_temp !== undefined) attributes.color_temp = params.color_temp;
                    if (params.rgb_color !== undefined) attributes.rgb_color = params.rgb_color; // Already validated by Zod

                    success = haLightsService.turnOn(params.entity_id, attributes);
                    if (!success) {
                        throw new Error(`Failed to turn on light '${params.entity_id}'. Entity not found?`);
                    }
                    lightDetails = haLightsService.getLight(params.entity_id); // Get updated state
                    return { status: "success", state: lightDetails }; // Confirm success and return new state

                case "turn_off":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for 'turn_off' action");
                    }
                    success = haLightsService.turnOff(params.entity_id);
                    if (!success) {
                        throw new Error(`Failed to turn off light '${params.entity_id}'. Entity not found?`);
                    }
                    lightDetails = haLightsService.getLight(params.entity_id); // Get updated state
                    return { status: "success", state: lightDetails }; // Confirm success and return new state

                default:
                    // This case should technically be unreachable due to Zod enum validation
                    throw new Error(`Unknown action: ${String(params.action)}`);
            }
        } catch (error) {
            logger.error(`Error in lights_control tool: ${error instanceof Error ? error.message : String(error)}`);
            // FastMCP might handle errors differently, potentially expecting errors to be thrown
            // or returned in a specific format. Throwing is common.
            throw error; // Re-throw the error to be handled by fastmcp
        }
    },
};

// No need for the class wrapper anymore
// export class LightsControlTool extends BaseTool { ... } 

// --- Shared Execution Logic --- 
// Extracted logic to be used by both fastmcp object and BaseTool class
async function executeLightsControlLogic(params: LightsControlParams): Promise<Record<string, unknown>> {
    let attributes: Record<string, unknown>;
    let success: boolean;
    let lightDetails: Record<string, unknown> | null;

    switch (params.action) {
        case "list":
            const lights = haLightsService.getLights();
            return { lights };

        case "get":
            if (!params.entity_id) {
                throw new Error("entity_id is required for 'get' action");
            }
            lightDetails = haLightsService.getLight(params.entity_id);
            if (!lightDetails) {
                throw new Error(`Light entity_id '${params.entity_id}' not found.`);
            }
            return lightDetails;

        case "turn_on":
            if (!params.entity_id) {
                throw new Error("entity_id is required for 'turn_on' action");
            }
            attributes = {};
            if (params.brightness !== undefined) attributes.brightness = params.brightness;
            if (params.color_temp !== undefined) attributes.color_temp = params.color_temp;
            if (params.rgb_color !== undefined) attributes.rgb_color = params.rgb_color;

            success = haLightsService.turnOn(params.entity_id, attributes);
            if (!success) {
                throw new Error(`Failed to turn on light '${params.entity_id}'. Entity not found?`);
            }
            lightDetails = haLightsService.getLight(params.entity_id); // Get updated state
            return { status: "success", state: lightDetails };

        case "turn_off":
            if (!params.entity_id) {
                throw new Error("entity_id is required for 'turn_off' action");
            }
            success = haLightsService.turnOff(params.entity_id);
            if (!success) {
                throw new Error(`Failed to turn off light '${params.entity_id}'. Entity not found?`);
            }
            lightDetails = haLightsService.getLight(params.entity_id); // Get updated state
            return { status: "success", state: lightDetails };

        default:
            // Should be unreachable due to Zod validation
            throw new Error(`Unknown action: ${String(params.action)}`);
    }
}

// --- Original BaseTool Class Definition (for compatibility with src/index.ts) ---
export class LightsControlTool extends BaseTool {
    constructor() {
        super({
            name: lightsControlTool.name, // Reuse name from fastmcp definition
            description: lightsControlTool.description, // Reuse description
            parameters: lightsControlSchema, // Reuse schema
            metadata: {
                category: "home_assistant", // Keep original metadata if needed
                version: "1.0.0",
                tags: ["lights", "home_assistant", "control"],
                // Add examples if BaseTool/MCPServer uses them
            }
        });
    }

    /**
     * Execute method for the BaseTool class
     */
    public async execute(params: LightsControlParams, context: MCPContext): Promise<Record<string, unknown>> {
        logger.debug(`Executing LightsControlTool (BaseTool) with params: ${JSON.stringify(params)}`);
        try {
            // Validate params using BaseTool's method (optional, Zod does it too)
            const validatedParams = this.validateParams(params);
            // Use the shared logic function
            const result = await executeLightsControlLogic(validatedParams); // Use validated params
            // Validate result (optional, depends on if you defined a returnType)
            // return this.validateResult(result);
            return result;
        } catch (error) {
            logger.error(`Error in LightsControlTool (BaseTool): ${String(error)}`);
            // Let BaseTool or MCPServer handle error formatting
            throw error;
        }
    }
} 