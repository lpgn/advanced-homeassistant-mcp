import { z } from "zod";
import { Tool } from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.js";

/**
 * Get System Prompt Tool
 * 
 * Returns contextual prompts with information about the Home Assistant system,
 * available entities, areas, and usage guidance for the LLM.
 * 
 * This implements the MCP Prompts feature to provide context-aware system prompts.
 */
export const getSystemPromptTool: Tool = {
  name: "get_system_prompt",
  description: 
    "Get a comprehensive system prompt with context about Home Assistant setup, available entities, areas, and tool usage guidance. " +
    "Use this at the start of a conversation to understand what devices and entities are available in the system.",
  parameters: z.object({
    include_entities: z.boolean().optional().default(true).describe("Whether to include entity list in the prompt"),
    include_areas: z.boolean().optional().default(true).describe("Whether to include area information"),
    domain_filter: z.array(z.string()).optional().describe("Optional list of domains to include (e.g., ['light', 'switch'])"),
  }),
  execute: async (params: { include_entities?: boolean; include_areas?: boolean; domain_filter?: string[] }) => {
    try {
      const includeEntities = params.include_entities !== false;
      const includeAreas = params.include_areas !== false;

      // Base prompt with tool usage guidance
      let promptText = `# Home Assistant MCP Server Context

You are connected to a Home Assistant instance via the Model Context Protocol (MCP).
You can control smart home devices, query their states, and automate the home.

## Available Tool Categories

1. **Device Control Tools**:
   - \`control\`: Control devices (turn on/off, set brightness, temperature, etc.)
   - \`lights_control\`: Advanced light control with color support
   - \`climate_control\`: Control thermostats and HVAC systems

2. **Information Tools**:
   - \`search_entities\`: Search for devices using natural language
   - \`get_live_context\`: Get real-time state of all entities
   - \`list_devices\`: List all available devices by domain
   - \`get_history\`: Get historical state data

3. **Automation Tools**:
   - \`automation\`: Manage automations (list, trigger, toggle)
   - \`automation_config\`: Create/update/delete automations
   - \`scene\`: Activate scenes

4. **System Tools**:
   - \`call_service\`: Call any Home Assistant service
   - \`system_management\`: System-level operations (restart, reload)
   - \`notify\`: Send notifications

## Usage Guidelines

### When controlling devices:
1. **Use natural language search first**: If you don't know the exact entity_id, use \`search_entities\` with a description like "kitchen light" or "bedroom temperature".
2. **Get live context for conditional actions**: If you need to check current state before acting (e.g., "turn off lights if they're on"), use \`get_live_context\` first.
3. **Use specific tools**: Prefer \`lights_control\` for lights, \`climate_control\` for climate devices, etc.

### When answering questions:
1. **For current state questions**: Always use \`get_live_context\` to get real-time data (e.g., "Is the light on?", "What's the temperature?").
2. **For historical questions**: Use \`get_history\` tool (e.g., "When was the door last opened?").
3. **For existence questions**: You can answer from the static context below (e.g., "Do I have lights in the bedroom?").

`;

      // Fetch and include entity information
      if (includeEntities) {
        const statesResponse = await fetch(
          `${APP_CONFIG.HASS_HOST}/api/states`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (statesResponse.ok) {
          let states = await statesResponse.json();

          // Apply domain filter if provided
          if (params.domain_filter && params.domain_filter.length > 0) {
            const domainSet = new Set(params.domain_filter.map(d => d.toLowerCase()));
            states = states.filter((entity: any) => {
              const domain = entity.entity_id.split(".")[0];
              return domainSet.has(domain);
            });
          }

          // Group entities by domain
          const entitiesByDomain: Record<string, any[]> = {};
          const areaMap: Record<string, string[]> = {};

          for (const entity of states) {
            const domain = entity.entity_id.split(".")[0];
            if (!entitiesByDomain[domain]) {
              entitiesByDomain[domain] = [];
            }

            const entityInfo = {
              entity_id: entity.entity_id,
              name: entity.attributes.friendly_name || entity.entity_id,
              state: entity.state,
            };

            entitiesByDomain[domain].push(entityInfo);

            // Track areas
            if (entity.attributes.area_id) {
              const areaId = entity.attributes.area_id;
              if (!areaMap[areaId]) {
                areaMap[areaId] = [];
              }
              areaMap[areaId].push(entity.entity_id);
            }
          }

          // Add entity summary
          promptText += `\n## Available Entities\n\n`;
          promptText += `Total entities: ${states.length} across ${Object.keys(entitiesByDomain).length} domains\n\n`;

          // Add domain breakdown
          promptText += `### Entities by Domain\n\n`;
          for (const [domain, entities] of Object.entries(entitiesByDomain).sort()) {
            promptText += `**${domain}** (${entities.length} entities):\n`;
            // Show first 5 entities per domain to keep prompt manageable
            const entitiesToShow = entities.slice(0, 5);
            for (const entity of entitiesToShow) {
              promptText += `- ${entity.name} (\`${entity.entity_id}\`)\n`;
            }
            if (entities.length > 5) {
              promptText += `  ... and ${entities.length - 5} more\n`;
            }
            promptText += `\n`;
          }

          // Add area information if requested
          if (includeAreas && Object.keys(areaMap).length > 0) {
            promptText += `\n### Areas\n\n`;
            for (const [areaId, entityIds] of Object.entries(areaMap).sort()) {
              promptText += `**${areaId}**: ${entityIds.length} entities\n`;
            }
            promptText += `\n`;
          }
        }
      }

      // Add best practices
      promptText += `\n## Best Practices

1. **Always verify entity existence**: Use \`search_entities\` before controlling if unsure about entity_id
2. **Check state before conditional actions**: Use \`get_live_context\` to get current state
3. **Provide feedback**: After executing commands, confirm the action was successful
4. **Handle errors gracefully**: If a command fails, explain why and suggest alternatives
5. **Be specific**: When possible, use exact entity_ids rather than relying on natural language matching

## System Information

- Home Assistant Host: ${APP_CONFIG.HASS_HOST}
- MCP Server Version: ${APP_CONFIG.VERSION}
- Timestamp: ${new Date().toISOString()}

---

You are now ready to assist with Home Assistant automation and control. Ask users what they'd like to do!
`;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            prompt: promptText,
            metadata: {
              generated_at: new Date().toISOString(),
              includes_entities: includeEntities,
              includes_areas: includeAreas,
              domain_filter: params.domain_filter || null,
            }
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
