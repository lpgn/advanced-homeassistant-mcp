/**
 * Lights Control Tool for Home Assistant
 * 
 * This tool allows controlling lights in Home Assistant through the MCP.
 * It supports turning lights on/off, changing brightness, color, and color temperature.
 */

import { z } from "zod";
import { BaseTool } from "../base-tool.js";
import { logger } from "../../utils/logger.js";
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

// Define the schema for our tool parameters
const lightsControlSchema = z.object({
    action: z.enum(["list", "get", "turn_on", "turn_off"]).describe("The action to perform"),
    entity_id: z.string().optional().describe("The entity ID of the light to control"),
    brightness: z.number().min(0).max(255).optional().describe("Brightness level (0-255)"),
    color_temp: z.number().min(153).max(500).optional().describe("Color temperature (153-500)"),
    rgb_color: z.tuple([
        z.number().min(0).max(255),
        z.number().min(0).max(255),
        z.number().min(0).max(255)
    ]).optional().describe("RGB color as [r, g, b]"),
});

type LightsControlParams = z.infer<typeof lightsControlSchema>;

/**
 * Tool for controlling lights in Home Assistant
 */
export class LightsControlTool extends BaseTool {
    constructor() {
        super({
            name: "lights_control",
            description: "Control lights in Home Assistant",
            parameters: lightsControlSchema,
            metadata: {
                category: "home_assistant",
                version: "1.0.0",
                tags: ["lights", "home_assistant", "control"],
                examples: [
                    {
                        description: "List all lights",
                        params: { action: "list" }
                    },
                    {
                        description: "Turn on a light with brightness",
                        params: {
                            action: "turn_on",
                            entity_id: "light.living_room",
                            brightness: 200
                        }
                    }
                ]
            }
        });
    }

    /**
     * Execute the tool
     */
    public async execute(params: LightsControlParams, context: MCPContext): Promise<Record<string, unknown>> {
        logger.debug(`Executing LightsControlTool with params: ${JSON.stringify(params)}`);

        try {
            // Add an await here to satisfy the linter
            await Promise.resolve();

            // Pre-declare variables that will be used in the switch statement
            let attributes: Record<string, unknown>;

            switch (params.action) {
                case "list":
                    return this.listLights();

                case "get":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for get action");
                    }
                    return this.getLight(params.entity_id);

                case "turn_on":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for turn_on action");
                    }

                    // Initialize attributes outside the case block
                    attributes = {};

                    if (params.brightness !== undefined) {
                        attributes.brightness = params.brightness;
                    }

                    if (params.color_temp !== undefined) {
                        attributes.color_temp = params.color_temp;
                    }

                    if (params.rgb_color !== undefined) {
                        // Ensure the rgb_color is passed correctly
                        attributes.rgb_color = [
                            params.rgb_color[0],
                            params.rgb_color[1],
                            params.rgb_color[2]
                        ];
                    }

                    return this.turnOnLight(params.entity_id, attributes);

                case "turn_off":
                    if (!params.entity_id) {
                        throw new Error("entity_id is required for turn_off action");
                    }
                    return this.turnOffLight(params.entity_id);

                default:
                    throw new Error(`Unknown action: ${String(params.action)}`);
            }
        } catch (error) {
            logger.error(`Error in LightsControlTool: ${String(error)}`);
            throw error;
        }
    }

    /**
     * List all available lights
     */
    private listLights(): Record<string, unknown> {
        const lights = haLightsService.getLights();

        return {
            success: true,
            lights,
            count: lights.length
        };
    }

    /**
     * Get a specific light
     */
    private getLight(entity_id: string): Record<string, unknown> {
        const light = haLightsService.getLight(entity_id);

        if (!light) {
            return {
                success: false,
                error: `Light ${entity_id} not found`
            };
        }

        return {
            success: true,
            light
        };
    }

    /**
     * Turn on a light
     */
    private turnOnLight(
        entity_id: string,
        attributes: Record<string, unknown>
    ): Record<string, unknown> {
        const success = haLightsService.turnOn(entity_id, attributes);

        if (!success) {
            return {
                success: false,
                error: `Failed to turn on ${entity_id}: light not found`
            };
        }

        const light = haLightsService.getLight(entity_id);

        return {
            success: true,
            message: `Turned on ${entity_id}`,
            light
        };
    }

    /**
     * Turn off a light
     */
    private turnOffLight(entity_id: string): Record<string, unknown> {
        const success = haLightsService.turnOff(entity_id);

        if (!success) {
            return {
                success: false,
                error: `Failed to turn off ${entity_id}: light not found`
            };
        }

        const light = haLightsService.getLight(entity_id);

        return {
            success: true,
            message: `Turned off ${entity_id}`,
            light
        };
    }
} 