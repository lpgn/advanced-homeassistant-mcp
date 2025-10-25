import { z } from 'zod';

/**
 * Get a comprehensive summary of all entities in a specific domain
 * Useful for quick overviews like "What lights do I have?" or "Show me all climate devices"
 */
export const domainSummaryTool = {
  name: 'domain_summary',
  description: 'Get a comprehensive summary of all entities in a specific domain (e.g., light, switch, sensor). Returns total count, state distribution, common attributes, and example entities.',
  parameters: z.object({
    domain: z.string().describe('The domain to summarize (e.g., "light", "switch", "sensor", "climate", "binary_sensor")'),
    example_limit: z.number().optional().default(3).describe('Number of example entities to include (default: 3)'),
  }),
  execute: async (params: { domain: string; example_limit?: number }) => {
    try {
      const HASS_HOST = process.env.HASS_HOST;
      const HASS_TOKEN = process.env.HASS_TOKEN;

      if (!HASS_HOST || !HASS_TOKEN) {
        throw new Error('HASS_HOST or HASS_TOKEN not configured');
      }

      const response = await fetch(`${HASS_HOST}/api/states`, {
        headers: {
          Authorization: `Bearer ${HASS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get states: ${response.statusText}`);
      }

      const allStates = await response.json();
      const domainEntities = allStates.filter((entity: any) => 
        entity.entity_id.startsWith(`${params.domain}.`)
      );

      if (domainEntities.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              domain: params.domain,
              total_count: 0,
              message: `No entities found in domain "${params.domain}"`,
            }, null, 2)
          }]
        };
      }

      // Group by state
      const stateDistribution: Record<string, number> = {};
      domainEntities.forEach((entity: any) => {
        stateDistribution[entity.state] = (stateDistribution[entity.state] || 0) + 1;
      });

      // Extract common attributes across all entities
      const attributeKeys = new Set<string>();
      domainEntities.forEach((entity: any) => {
        if (entity.attributes) {
          Object.keys(entity.attributes).forEach(key => attributeKeys.add(key));
        }
      });

      // Get example entities
      const examples = domainEntities
        .slice(0, params.example_limit || 3)
        .map((entity: any) => ({
          entity_id: entity.entity_id,
          state: entity.state,
          friendly_name: entity.attributes?.friendly_name || entity.entity_id,
          key_attributes: Object.keys(entity.attributes || {}).slice(0, 5),
        }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            domain: params.domain,
            total_count: domainEntities.length,
            state_distribution: stateDistribution,
            common_attributes: Array.from(attributeKeys).sort(),
            examples,
            note: `Showing ${examples.length} of ${domainEntities.length} entities`,
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
