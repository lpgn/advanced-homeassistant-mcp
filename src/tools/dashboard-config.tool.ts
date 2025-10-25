import { z } from 'zod';

/**
 * Dashboard configuration tool for creating and modifying Lovelace dashboards
 * Create cards, views, and complete dashboard layouts programmatically
 */
export const dashboardConfigTool = {
  name: 'dashboard_config',
  description: 'Create and configure Home Assistant Lovelace dashboards. Generate dashboard configurations, add views, create cards, and layout optimized interfaces. Returns dashboard configuration in JSON/YAML format.',
  parameters: z.object({
    operation: z.enum(['create_view', 'create_card', 'generate_layout', 'list_card_types', 'get_recommendations']).describe('Operation: create_view (new dashboard view), create_card (card configuration), generate_layout (complete dashboard), list_card_types (available cards), get_recommendations (AI suggestions)'),
    config: z.any().optional().describe('Configuration object for the operation. Structure varies by operation type.'),
  }),
  execute: async (params: { operation: string; config?: any }) => {
    try {
      // List available card types
      if (params.operation === 'list_card_types') {
        const result = {
          success: true,
          card_types: [
            {
              type: 'entities',
              description: 'Display multiple entities in a list',
              example: { type: 'entities', entities: ['light.living_room', 'switch.fan'] },
            },
            {
              type: 'button',
              description: 'Interactive button for entity control',
              example: { type: 'button', entity: 'light.living_room', name: 'Living Room' },
            },
            {
              type: 'picture-entity',
              description: 'Entity control with background image',
              example: { type: 'picture-entity', entity: 'light.bedroom', image: '/local/bedroom.jpg' },
            },
            {
              type: 'glance',
              description: 'Compact view of multiple entities',
              example: { type: 'glance', entities: ['sensor.temperature', 'sensor.humidity'] },
            },
            {
              type: 'thermostat',
              description: 'Climate control card',
              example: { type: 'thermostat', entity: 'climate.living_room' },
            },
            {
              type: 'weather-forecast',
              description: 'Weather information display',
              example: { type: 'weather-forecast', entity: 'weather.home' },
            },
            {
              type: 'sensor',
              description: 'Single sensor display with graph',
              example: { type: 'sensor', entity: 'sensor.temperature', graph: 'line' },
            },
            {
              type: 'history-graph',
              description: 'Historical data graph',
              example: { type: 'history-graph', entities: ['sensor.temperature'], hours_to_show: 24 },
            },
            {
              type: 'gauge',
              description: 'Circular gauge for numeric values',
              example: { type: 'gauge', entity: 'sensor.cpu_usage', min: 0, max: 100 },
            },
            {
              type: 'markdown',
              description: 'Markdown text card',
              example: { type: 'markdown', content: '# Welcome\nYour smart home dashboard' },
            },
            {
              type: 'horizontal-stack',
              description: 'Stack cards horizontally',
              example: { type: 'horizontal-stack', cards: [] },
            },
            {
              type: 'vertical-stack',
              description: 'Stack cards vertically',
              example: { type: 'vertical-stack', cards: [] },
            },
            {
              type: 'grid',
              description: 'Grid layout for multiple cards',
              example: { type: 'grid', cards: [], columns: 2 },
            },
            {
              type: 'conditional',
              description: 'Show card based on conditions',
              example: { type: 'conditional', conditions: [{ entity: 'sun.sun', state: 'below_horizon' }], card: {} },
            },
          ],
          note: 'Use these card types in create_card or generate_layout operations',
        };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      // Create a dashboard view
      if (params.operation === 'create_view') {
        const view = {
          title: params.config?.title || 'New View',
          path: params.config?.path || 'new_view',
          icon: params.config?.icon || 'mdi:view-dashboard',
          type: params.config?.type || 'panel',
          badges: params.config?.badges || [],
          cards: params.config?.cards || [],
        };

        const result = {
          success: true,
          message: 'View configuration created',
          view_config: view,
          yaml_config: `- title: ${view.title}
  path: ${view.path}
  icon: ${view.icon}
  badges: []
  cards: []`,
          next_steps: [
            'Add this view configuration to your dashboard',
            'Use create_card operation to add cards to this view',
            'Configure badges for quick entity status display',
          ],
        };
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}]
        };
      }

      // Create a card configuration
      if (params.operation === 'create_card') {
        if (!params.config?.type) {
          const result = {
            success: false,
            message: 'Card type is required. Use list_card_types to see available types.',
          };
          return {
            content: [{type: "text", text: JSON.stringify(result, null, 2)}]
          };
        }

        const card = {
          type: params.config.type,
          ...params.config,
        };

        // Add example configurations based on card type
        const examples: Record<string, any> = {
          entities: {
            title: params.config.title || 'Entities',
            entities: params.config.entities || [],
            show_header_toggle: params.config.show_header_toggle ?? true,
          },
          button: {
            entity: params.config.entity,
            name: params.config.name,
            icon: params.config.icon,
            tap_action: { action: 'toggle' },
          },
          'history-graph': {
            entities: params.config.entities || [],
            hours_to_show: params.config.hours_to_show || 24,
            refresh_interval: params.config.refresh_interval || 0,
          },
        };

        const enhancedCard = { ...card, ...(examples[params.config.type] || {}) };

        const result = {
          success: true,
          message: `${params.config.type} card configuration created`,
          card_config: enhancedCard,
          yaml_config: generateYamlForCard(enhancedCard),
        };
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}]
        };
      }

      // Generate complete dashboard layout
      if (params.operation === 'generate_layout') {
        const layout = {
          title: params.config?.title || 'My Dashboard',
          views: [
            {
              title: 'Home',
              path: 'home',
              icon: 'mdi:home',
              badges: [],
              cards: [
                {
                  type: 'weather-forecast',
                  entity: 'weather.home',
                  show_forecast: true,
                },
                {
                  type: 'entities',
                  title: 'Quick Controls',
                  show_header_toggle: true,
                  entities: params.config?.quick_entities || [],
                },
              ],
            },
            {
              title: 'Lights',
              path: 'lights',
              icon: 'mdi:lightbulb',
              badges: [],
              cards: [
                {
                  type: 'light',
                  entity: params.config?.main_light || 'light.living_room',
                },
              ],
            },
            {
              title: 'Climate',
              path: 'climate',
              icon: 'mdi:thermostat',
              badges: [],
              cards: [
                {
                  type: 'thermostat',
                  entity: params.config?.thermostat || 'climate.living_room',
                },
              ],
            },
          ],
        };

        const result = {
          success: true,
          message: 'Complete dashboard layout generated',
          dashboard_config: layout,
          yaml_config: generateYamlForDashboard(layout),
          instructions: `To apply this dashboard:
1. Go to Home Assistant Settings > Dashboards
2. Click "Add Dashboard"
3. Choose "New dashboard from scratch"
4. Switch to YAML mode (click the three dots > Edit in YAML)
5. Paste the configuration above
6. Click Save

Alternatively, if using YAML mode:
1. Edit ui-lovelace.yaml in your config directory
2. Paste the views configuration
3. Restart Home Assistant or reload Lovelace configuration`,
        };
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}]
        };
      }

      // Get AI recommendations for dashboard optimization
      if (params.operation === 'get_recommendations') {
        const result = {
          success: true,
          message: 'Dashboard optimization recommendations',
          recommendations: [
            {
              category: 'Layout',
              suggestions: [
                'Use grid cards for compact, responsive layouts',
                'Group related entities in the same card',
                'Place most-used controls at the top of each view',
                'Use badges for at-a-glance status information',
              ],
            },
            {
              category: 'Performance',
              suggestions: [
                'Limit history-graph cards to 24-48 hours for faster loading',
                'Use conditional cards to show/hide based on state',
                'Combine multiple entity cards into single entities cards',
                'Set appropriate refresh intervals for data-heavy cards',
              ],
            },
            {
              category: 'User Experience',
              suggestions: [
                'Use meaningful titles and icons for views',
                'Add friendly names to all entities',
                'Group devices by room or function',
                'Create separate mobile and desktop views if needed',
                'Use picture-entity cards for visual appeal',
              ],
            },
            {
              category: 'Organization',
              suggestions: [
                'Create separate views for: Home, Lights, Climate, Security, Media, Energy',
                'Use horizontal-stack for grouping related controls',
                'Add markdown cards for section headers and instructions',
                'Keep critical controls on the first view',
              ],
            },
          ],
          best_practices: {
            mobile: 'Use single-column layouts with larger tap targets',
            desktop: 'Utilize multi-column grids for information density',
            accessibility: 'Ensure sufficient contrast and readable font sizes',
            maintenance: 'Document custom configurations in markdown cards',
          },
        };
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}]
        };
      }

      const errorResult = {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            message: 'Invalid operation',
          }, null, 2)
        }]
      };
      return errorResult;
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

// Helper function to generate YAML for cards
function generateYamlForCard(card: any): string {
  const lines = [`type: ${card.type}`];
  
  Object.entries(card).forEach(([key, value]) => {
    if (key !== 'type') {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        value.forEach(item => {
          if (typeof item === 'string') {
            lines.push(`  - ${item}`);
          } else {
            lines.push(`  - ${JSON.stringify(item)}`);
          }
        });
      } else if (typeof value === 'object') {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  });
  
  return lines.join('\n');
}

// Helper function to generate YAML for complete dashboard
function generateYamlForDashboard(dashboard: any): string {
  let yaml = `title: ${dashboard.title}\nviews:\n`;
  
  dashboard.views.forEach((view: any) => {
    yaml += `  - title: ${view.title}\n`;
    yaml += `    path: ${view.path}\n`;
    yaml += `    icon: ${view.icon}\n`;
    yaml += `    badges: []\n`;
    yaml += `    cards:\n`;
    
    view.cards.forEach((card: any) => {
      yaml += `      - type: ${card.type}\n`;
      Object.entries(card).forEach(([key, value]) => {
        if (key !== 'type') {
          yaml += `        ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}\n`;
        }
      });
    });
  });
  
  return yaml;
}
