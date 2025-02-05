import { z } from "zod";
import { Tool } from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.js";
import { HassState } from "../types/index.js";

export const listDevicesTool: Tool = {
  name: "list_devices",
  description: "List all available Home Assistant devices",
  parameters: z.object({}).describe("No parameters required"),
  execute: async () => {
    try {
      const response = await fetch(`${APP_CONFIG.HASS_HOST}/api/states`, {
        headers: {
          Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.statusText}`);
      }

      const states = (await response.json()) as HassState[];
      const devices: Record<string, HassState[]> = {
        light: states.filter(state => state.entity_id.startsWith('light.')),
        climate: states.filter(state => state.entity_id.startsWith('climate.'))
      };

      return {
        success: true,
        devices,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
};
