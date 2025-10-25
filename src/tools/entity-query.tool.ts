import { z } from 'zod';

/**
 * Get entity state with optional field filtering for token efficiency
 * Supports minimal, detailed, or custom field selection
 */
export const getEntityTool = {
  name: 'get_entity',
  description: 'Get the state of a Home Assistant entity with optional field filtering to reduce token usage. Use fields parameter to get specific attributes only, or detailed=false for minimal response.',
  parameters: z.object({
    entity_id: z.string().describe('The entity ID to query (e.g., "light.living_room")'),
    fields: z.array(z.string()).optional().describe('Optional array of specific fields to return (e.g., ["state", "attributes.brightness"]). If provided, only these fields will be included in the response.'),
    detailed: z.boolean().optional().default(false).describe('If true, return all entity data. If false (default), return only entity_id, state, and friendly_name for token efficiency.'),
  }),
  execute: async (params: { entity_id: string; fields?: string[]; detailed?: boolean }) => {
    try {
      const HASS_HOST = process.env.HASS_HOST;
      const HASS_TOKEN = process.env.HASS_TOKEN;

      if (!HASS_HOST || !HASS_TOKEN) {
        throw new Error('HASS_HOST or HASS_TOKEN not configured');
      }

      const response = await fetch(`${HASS_HOST}/api/states/${params.entity_id}`, {
        headers: {
          Authorization: `Bearer ${HASS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: `Entity ${params.entity_id} not found`,
          };
        }
        throw new Error(`Failed to get entity: ${response.statusText}`);
      }

      const entity = await response.json();

      // Custom field filtering
      if (params.fields && params.fields.length > 0) {
        const result: any = {};
        for (const field of params.fields) {
          const keys = field.split('.');
          let source = entity;
          let target = result;
          
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (i === keys.length - 1) {
              target[key] = source[key];
            } else {
              if (!target[key]) target[key] = {};
              target = target[key];
              source = source[key];
            }
          }
        }
        return {
          success: true,
          entity_id: params.entity_id,
          ...result,
        };
      }

      // Minimal response (default)
      if (!params.detailed) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              entity_id: entity.entity_id,
              state: entity.state,
              friendly_name: entity.attributes?.friendly_name || entity.entity_id,
              last_changed: entity.last_changed,
              last_updated: entity.last_updated,
            }, null, 2)
          }]
        };
      }

      // Detailed response
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            ...entity,
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
          }, null, 2)
        }]
      };
    }
  },
};
