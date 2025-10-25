import { z } from 'zod';

/**
 * Get a comprehensive overview of the entire Home Assistant system
 * One-stop system status check showing version, entity counts, domains, and integrations
 */
export const systemOverviewTool = {
  name: 'system_overview',
  description: 'Get a comprehensive overview of the entire Home Assistant system including version, entity counts by domain, total entities, available service domains, and system configuration.',
  parameters: z.object({}),
  execute: async () => {
    try {
      const HASS_HOST = process.env.HASS_HOST;
      const HASS_TOKEN = process.env.HASS_TOKEN;

      if (!HASS_HOST || !HASS_TOKEN) {
        throw new Error('HASS_HOST or HASS_TOKEN not configured');
      }

      // Fetch all required data in parallel for efficiency
      const [statesResponse, configResponse, servicesResponse] = await Promise.all([
        fetch(`${HASS_HOST}/api/states`, {
          headers: {
            Authorization: `Bearer ${HASS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${HASS_HOST}/api/config`, {
          headers: {
            Authorization: `Bearer ${HASS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${HASS_HOST}/api/services`, {
          headers: {
            Authorization: `Bearer ${HASS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (!statesResponse.ok || !configResponse.ok || !servicesResponse.ok) {
        throw new Error('Failed to fetch system data');
      }

      const states = await statesResponse.json();
      const config = await configResponse.json();
      const services = await servicesResponse.json();

      // Group entities by domain and count
      const domainCounts: Record<string, number> = {};
      const domainStates: Record<string, Record<string, number>> = {};
      
      states.forEach((entity: any) => {
        const domain = entity.entity_id.split('.')[0];
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        
        if (!domainStates[domain]) domainStates[domain] = {};
        domainStates[domain][entity.state] = (domainStates[domain][entity.state] || 0) + 1;
      });

      // Sort domains by entity count
      const sortedDomains = Object.entries(domainCounts)
        .sort(([, a], [, b]) => b - a)
        .reduce((acc, [domain, count]) => {
          acc[domain] = count;
          return acc;
        }, {} as Record<string, number>);

      // Get service domains
      const serviceDomains = Object.keys(services).sort();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            system: {
              version: config.version,
              location_name: config.location_name,
              time_zone: config.time_zone,
              unit_system: config.unit_system,
            },
            entities: {
              total_count: states.length,
              by_domain: sortedDomains,
              domain_count: Object.keys(domainCounts).length,
            },
            services: {
              total_domains: serviceDomains.length,
              domains: serviceDomains,
            },
            top_domains: Object.entries(sortedDomains)
              .slice(0, 5)
              .map(([domain, count]) => ({
                domain,
                entity_count: count,
                states: domainStates[domain],
              })),
            components_loaded: config.components?.length || 0,
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
