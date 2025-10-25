import { z } from "zod";
import { Tool } from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.js";

/**
 * GetLiveContext Tool
 * 
 * Provides real-time information about the CURRENT state, value, or mode of devices,
 * sensors, entities, or areas. This is a primary function for answering questions
 * about current conditions (e.g., "Is the light on?", "What's the temperature?").
 * 
 * Returns state information in YAML format for all entities.
 */
export const getLiveContextTool: Tool = {
  name: "get_live_context",
  description: 
    "Provides real-time information about the CURRENT state, value, or mode of devices, sensors, entities, or areas. " +
    "Use this tool for: " +
    "1. Answering questions about current conditions (e.g., 'Is the light on?', 'What is the temperature outside?'). " +
    "2. As the first step in conditional actions (e.g., 'If the weather is rainy, turn off sprinklers' requires checking the weather first). " +
    "Returns a YAML formatted overview of all entities and their current states.",
  parameters: z.object({
    filter: z.string().optional().describe("Optional filter to limit entities by domain (e.g., 'light', 'sensor') or entity_id pattern"),
  }),
  execute: async (params: { filter?: string }) => {
    try {
      // Fetch all states from Home Assistant
      const response = await fetch(
        `${APP_CONFIG.HASS_HOST}/api/states`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Failed to retrieve states from Home Assistant: ${response.statusText}`
            }, null, 2)
          }]
        };
      }

      const states = await response.json();

      // Apply filter if provided
      let filteredStates = states;
      if (params.filter) {
        const filterLower = params.filter.toLowerCase();
        filteredStates = states.filter((entity: any) => {
          const entityIdLower = entity.entity_id.toLowerCase();
          // Check if filter matches domain or entity_id pattern
          return entityIdLower.startsWith(filterLower + ".") || 
                 entityIdLower.includes(filterLower);
        });
      }

      if (filteredStates.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "No entities found matching the filter"
            }, null, 2)
          }]
        };
      }

      // Group entities by domain for better organization
      const entitiesByDomain: Record<string, any[]> = {};
      for (const entity of filteredStates) {
        const domain = entity.entity_id.split(".")[0];
        if (!entitiesByDomain[domain]) {
          entitiesByDomain[domain] = [];
        }

        // Create a simplified entity object for YAML output
        const simplifiedEntity: any = {
          entity_id: entity.entity_id,
          state: entity.state,
          name: entity.attributes.friendly_name || entity.entity_id,
        };

        // Add important attributes based on domain
        switch (domain) {
          case "light":
            if (entity.attributes.brightness !== undefined) {
              simplifiedEntity.brightness = entity.attributes.brightness;
            }
            if (entity.attributes.rgb_color) {
              simplifiedEntity.rgb_color = entity.attributes.rgb_color;
            }
            break;
          case "climate":
            if (entity.attributes.current_temperature !== undefined) {
              simplifiedEntity.current_temperature = entity.attributes.current_temperature;
            }
            if (entity.attributes.temperature !== undefined) {
              simplifiedEntity.target_temperature = entity.attributes.temperature;
            }
            if (entity.attributes.hvac_mode) {
              simplifiedEntity.hvac_mode = entity.attributes.hvac_mode;
            }
            break;
          case "sensor":
            if (entity.attributes.unit_of_measurement) {
              simplifiedEntity.unit = entity.attributes.unit_of_measurement;
            }
            if (entity.attributes.device_class) {
              simplifiedEntity.device_class = entity.attributes.device_class;
            }
            break;
          case "cover":
            if (entity.attributes.current_position !== undefined) {
              simplifiedEntity.position = entity.attributes.current_position;
            }
            break;
        }

        // Add area if available
        if (entity.attributes.area_id) {
          simplifiedEntity.area = entity.attributes.area_id;
        }

        entitiesByDomain[domain].push(simplifiedEntity);
      }

      // Convert to YAML
      // Convert to YAML-like format (manually formatted for readability)
      let yamlOutput = `total_entities: ${filteredStates.length}\n`;
      yamlOutput += `timestamp: ${new Date().toISOString()}\n`;
      yamlOutput += `entities_by_domain:\n`;
      
      for (const [domain, entities] of Object.entries(entitiesByDomain).sort()) {
        yamlOutput += `  ${domain}:\n`;
        for (const entity of entities) {
          yamlOutput += `    - entity_id: ${entity.entity_id}\n`;
          yamlOutput += `      state: "${entity.state}"\n`;
          yamlOutput += `      name: "${entity.name}"\n`;
          
          // Add domain-specific attributes
          const keys = Object.keys(entity).filter(k => !['entity_id', 'state', 'name', 'area'].includes(k));
          for (const key of keys) {
            const value = entity[key];
            if (Array.isArray(value)) {
              yamlOutput += `      ${key}: [${value.join(', ')}]\n`;
            } else {
              yamlOutput += `      ${key}: ${value}\n`;
            }
          }
          
          if (entity.area) {
            yamlOutput += `      area: ${entity.area}\n`;
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            result: yamlOutput,
            summary: `Retrieved ${filteredStates.length} entities across ${Object.keys(entitiesByDomain).length} domains`
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
          }, null, 2)
        }]
      };
    }
  },
};
