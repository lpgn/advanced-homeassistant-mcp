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
      const devices: Record<string, HassState[]> = {};

      // Group devices by domain
      states.forEach(state => {
        const [domain] = state.entity_id.split('.');
        if (!devices[domain]) {
          devices[domain] = [];
        }
        devices[domain].push(state);
      });

      // Calculate device statistics
      const deviceStats = Object.entries(devices).map(([domain, entities]) => {
        const activeStates = ['on', 'home', 'unlocked', 'open'];
        const active = entities.filter(e => activeStates.includes(e.state)).length;
        const uniqueStates = [...new Set(entities.map(e => e.state))];

        return {
          domain,
          count: entities.length,
          active,
          inactive: entities.length - active,
          states: uniqueStates,
          sample: entities.slice(0, 2).map(e => ({
            id: e.entity_id,
            state: e.state,
            name: e.attributes?.friendly_name || e.entity_id
          }))
        };
      });

      const totalDevices = states.length;
      const deviceTypes = Object.keys(devices);

      const deviceSummary = {
        total_devices: totalDevices,
        device_types: deviceTypes,
        by_domain: Object.fromEntries(
          deviceStats.map(stat => [
            stat.domain,
            {
              count: stat.count,
              active: stat.active,
              states: stat.states,
              sample: stat.sample
            }
          ])
        )
      };

      return {
        success: true,
        devices,
        device_summary: deviceSummary
      };
    } catch (error) {
      console.error('Error in list devices tool:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        devices: {},
        device_summary: {
          total_devices: 0,
          device_types: [],
          by_domain: {}
        }
      };
    }
  },
};
