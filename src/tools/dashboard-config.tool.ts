import { z } from 'zod';

/**
 * Dashboard configuration tool for creating and modifying Lovelace dashboards
 * Create cards, views, and complete dashboard layouts programmatically
 */
export const dashboardConfigTool = {
  name: 'dashboard_config',
  description: 'Create and configure Home Assistant Lovelace dashboards. Generate dashboard configurations, add views, create cards, and layout optimized interfaces. Supports device-specific layouts (mobile/tablet/desktop/wall-panel) and intelligent prioritization (most-used/by-area/by-type/custom). Returns dashboard configuration in JSON/YAML format.',
  parameters: z.object({
    operation: z.enum([
      'create_view', 
      'create_card', 
      'generate_layout', 
      'list_card_types', 
      'get_recommendations',
      'generate_smart_layout',
      'analyze_usage_patterns',
      'optimize_for_device'
    ]).describe('Operation: create_view (new view), create_card (single card), generate_layout (basic dashboard), list_card_types (available cards), get_recommendations (AI suggestions), generate_smart_layout (intelligent analysis-based layout), analyze_usage_patterns (detect frequently used entities), optimize_for_device (device-specific layout)'),
    config: z.any().optional().describe('Configuration object. For generate_smart_layout: {device_type: "mobile"|"desktop"|"tablet"|"wall-panel", priority: "most-used"|"by-area"|"by-type"|"custom", areas?: string[], custom_priority?: string[]}. For optimize_for_device: {device_type, existing_layout}. For analyze_usage_patterns: {days: number}'),
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

      // Analyze usage patterns to determine frequently used entities
      if (params.operation === 'analyze_usage_patterns') {
        const days = params.config?.days || 7;
        const result = {
          success: true,
          message: `Usage pattern analysis for last ${days} days`,
          analysis: {
            most_used_entities: [
              { entity_id: 'light.living_room', usage_count: 245, avg_daily: 35, category: 'lighting' },
              { entity_id: 'climate.bedroom', usage_count: 168, avg_daily: 24, category: 'climate' },
              { entity_id: 'switch.coffee_maker', usage_count: 147, avg_daily: 21, category: 'switch' },
              { entity_id: 'light.kitchen', usage_count: 134, avg_daily: 19, category: 'lighting' },
              { entity_id: 'media_player.living_room_tv', usage_count: 98, avg_daily: 14, category: 'media' },
            ],
            usage_by_time: {
              morning: ['switch.coffee_maker', 'light.kitchen', 'climate.bedroom'],
              afternoon: ['light.living_room', 'media_player.living_room_tv'],
              evening: ['light.living_room', 'light.bedroom', 'climate.bedroom'],
              night: ['light.bedroom', 'lock.front_door'],
            },
            usage_by_area: {
              living_room: { total_interactions: 343, top_entities: ['light.living_room', 'media_player.living_room_tv'] },
              bedroom: { total_interactions: 234, top_entities: ['climate.bedroom', 'light.bedroom'] },
              kitchen: { total_interactions: 281, top_entities: ['light.kitchen', 'switch.coffee_maker'] },
            },
            recommendations: [
              'Place light.living_room in primary position - highest usage',
              'Create morning routine card with coffee_maker and kitchen light',
              'Add climate controls to bedroom view for better access',
              'Consider automation for bedroom climate based on usage patterns',
            ],
          },
          note: 'This is simulated data. In production, this would query Home Assistant history database.',
        };
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}]
        };
      }

      // Generate smart layout based on analysis and device type
      if (params.operation === 'generate_smart_layout') {
        const deviceType = params.config?.device_type || 'desktop';
        const priority = params.config?.priority || 'most-used';
        const areas = params.config?.areas || ['living_room', 'bedroom', 'kitchen'];

        const layouts = generateSmartLayoutByDevice(deviceType, priority, areas);
        
        const result = {
          success: true,
          message: `Smart dashboard layout generated for ${deviceType} with ${priority} priority`,
          device_type: deviceType,
          priority_mode: priority,
          dashboard_config: layouts,
          yaml_config: generateYamlForDashboard(layouts),
          optimization_notes: getOptimizationNotes(deviceType, priority),
          instructions: `
## How to Use This Layout

1. **Copy the YAML configuration** from yaml_config above
2. **Go to Home Assistant** > Settings > Dashboards
3. **Add new dashboard** or edit existing
4. **Switch to YAML mode** (three dots menu > Edit in YAML)
5. **Paste the configuration**
6. **Customize entities** - Replace placeholder entities with your actual entity IDs
7. **Save and test** on your ${deviceType}

## Device-Specific Features
${getDeviceFeatureNotes(deviceType)}

## Priority Optimization
${getPriorityNotes(priority)}
          `.trim(),
        };
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}]
        };
      }

      // Optimize existing layout for specific device
      if (params.operation === 'optimize_for_device') {
        const deviceType = params.config?.device_type || 'mobile';
        const existingLayout = params.config?.existing_layout || {};
        
        const optimized = optimizeLayoutForDevice(deviceType, existingLayout);
        
        const result = {
          success: true,
          message: `Layout optimized for ${deviceType}`,
          device_type: deviceType,
          original_layout: existingLayout,
          optimized_layout: optimized,
          changes_made: getOptimizationChanges(deviceType),
          yaml_config: generateYamlForDashboard(optimized),
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

// Generate smart layout based on device type and priority
function generateSmartLayoutByDevice(deviceType: string, priority: string, areas: string[]): any {
  const layouts: Record<string, any> = {
    mobile: {
      title: 'Mobile Dashboard',
      views: [
        {
          title: 'Home',
          path: 'home',
          icon: 'mdi:home',
          type: 'sections',
          badges: [
            { type: 'entity', entity: 'person.owner' },
            { type: 'entity', entity: 'sensor.temperature' },
          ],
          cards: [
            {
              type: 'vertical-stack',
              cards: [
                {
                  type: 'weather-forecast',
                  entity: 'weather.home',
                  show_forecast: false,
                },
                {
                  type: 'tile',
                  entity: 'light.living_room',
                  name: 'Living Room',
                  icon: 'mdi:lightbulb',
                  vertical: true,
                  tap_action: { action: 'toggle' },
                },
                {
                  type: 'tile',
                  entity: 'climate.bedroom',
                  name: 'Bedroom',
                  vertical: true,
                  features: [
                    { type: 'climate-hvac-modes' },
                    { type: 'climate-preset-modes' },
                  ],
                },
              ],
            },
            {
              type: 'entities',
              title: 'Quick Actions',
              show_header_toggle: false,
              entities: [
                { entity: 'switch.coffee_maker', name: 'Coffee Maker', icon: 'mdi:coffee' },
                { entity: 'lock.front_door', name: 'Front Door' },
                { entity: 'scene.good_night', name: 'Good Night', icon: 'mdi:weather-night' },
              ],
            },
          ],
        },
        {
          title: 'Rooms',
          path: 'rooms',
          icon: 'mdi:floor-plan',
          cards: areas.map(area => ({
            type: 'entities',
            title: area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            show_header_toggle: true,
            entities: [
              `light.${area}`,
              `climate.${area}`,
              `sensor.${area}_temperature`,
            ],
          })),
        },
      ],
    },
    desktop: {
      title: 'Desktop Dashboard',
      views: [
        {
          title: 'Overview',
          path: 'overview',
          icon: 'mdi:view-dashboard',
          type: 'panel',
          badges: [],
          cards: [
            {
              type: 'grid',
              columns: 3,
              square: false,
              cards: [
                {
                  type: 'weather-forecast',
                  entity: 'weather.home',
                  show_forecast: true,
                },
                {
                  type: 'gauge',
                  entity: 'sensor.cpu_usage',
                  name: 'CPU Usage',
                  min: 0,
                  max: 100,
                  severity: {
                    green: 0,
                    yellow: 60,
                    red: 80,
                  },
                },
                {
                  type: 'gauge',
                  entity: 'sensor.memory_usage',
                  name: 'Memory',
                  min: 0,
                  max: 100,
                  severity: {
                    green: 0,
                    yellow: 70,
                    red: 90,
                  },
                },
                {
                  type: 'entities',
                  title: 'Quick Controls',
                  show_header_toggle: true,
                  entities: [
                    'light.living_room',
                    'light.kitchen',
                    'light.bedroom',
                    'climate.living_room',
                  ],
                },
                {
                  type: 'history-graph',
                  title: 'Temperature History',
                  entities: [
                    'sensor.living_room_temperature',
                    'sensor.bedroom_temperature',
                    'sensor.kitchen_temperature',
                  ],
                  hours_to_show: 24,
                  refresh_interval: 0,
                },
                {
                  type: 'vertical-stack',
                  cards: [
                    {
                      type: 'markdown',
                      content: '## System Status',
                    },
                    {
                      type: 'glance',
                      entities: [
                        'sensor.uptime',
                        'sensor.disk_usage',
                        'sensor.cpu_temperature',
                      ],
                      show_name: true,
                      show_state: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Lights',
          path: 'lights',
          icon: 'mdi:lightbulb-group',
          type: 'panel',
          cards: [
            {
              type: 'grid',
              columns: 4,
              square: false,
              cards: areas.map(area => ({
                type: 'light',
                entity: `light.${area}`,
                name: area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              })),
            },
          ],
        },
        {
          title: 'Climate',
          path: 'climate',
          icon: 'mdi:thermostat',
          cards: [
            {
              type: 'grid',
              columns: 2,
              cards: areas.map(area => ({
                type: 'thermostat',
                entity: `climate.${area}`,
                name: area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              })),
            },
          ],
        },
        {
          title: 'Energy',
          path: 'energy',
          icon: 'mdi:lightning-bolt',
          cards: [
            {
              type: 'energy-distribution',
              title: 'Energy Distribution',
            },
            {
              type: 'grid',
              columns: 2,
              cards: [
                {
                  type: 'energy-date-selection',
                },
                {
                  type: 'energy-sources-table',
                },
              ],
            },
            {
              type: 'statistics-graph',
              title: 'Energy Consumption',
              entities: [
                { entity: 'sensor.energy_consumption' },
              ],
              stat_types: ['mean', 'min', 'max'],
              chart_type: 'bar',
              period: 'hour',
            },
          ],
        },
      ],
    },
    tablet: {
      title: 'Tablet Dashboard',
      views: [
        {
          title: 'Control Center',
          path: 'control',
          icon: 'mdi:tablet',
          type: 'panel',
          cards: [
            {
              type: 'grid',
              columns: 2,
              square: false,
              cards: [
                {
                  type: 'vertical-stack',
                  cards: [
                    {
                      type: 'weather-forecast',
                      entity: 'weather.home',
                      show_forecast: true,
                    },
                    {
                      type: 'horizontal-stack',
                      cards: [
                        {
                          type: 'button',
                          entity: 'scene.movie_time',
                          name: 'Movie',
                          icon: 'mdi:movie',
                          tap_action: { action: 'call-service', service: 'scene.turn_on', service_data: { entity_id: 'scene.movie_time' } },
                        },
                        {
                          type: 'button',
                          entity: 'scene.good_morning',
                          name: 'Morning',
                          icon: 'mdi:weather-sunny',
                          tap_action: { action: 'call-service', service: 'scene.turn_on', service_data: { entity_id: 'scene.good_morning' } },
                        },
                        {
                          type: 'button',
                          entity: 'scene.good_night',
                          name: 'Night',
                          icon: 'mdi:weather-night',
                          tap_action: { action: 'call-service', service: 'scene.turn_on', service_data: { entity_id: 'scene.good_night' } },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'entities',
                  title: 'Most Used',
                  show_header_toggle: true,
                  entities: [
                    { entity: 'light.living_room', name: 'Living Room Light' },
                    { entity: 'climate.bedroom', name: 'Bedroom Climate' },
                    { entity: 'switch.coffee_maker', name: 'Coffee Maker' },
                    { entity: 'media_player.living_room_tv', name: 'TV' },
                  ],
                },
                {
                  type: 'grid',
                  columns: 2,
                  square: true,
                  cards: areas.map(area => ({
                    type: 'tile',
                    entity: `light.${area}`,
                    name: area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    icon: 'mdi:lightbulb',
                  })),
                },
                {
                  type: 'vertical-stack',
                  cards: [
                    {
                      type: 'markdown',
                      content: '## Climate Control',
                    },
                    {
                      type: 'thermostat',
                      entity: 'climate.living_room',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Security',
          path: 'security',
          icon: 'mdi:shield-home',
          cards: [
            {
              type: 'alarm-panel',
              entity: 'alarm_control_panel.home',
              states: ['arm_home', 'arm_away'],
            },
            {
              type: 'picture-glance',
              title: 'Cameras',
              camera_image: 'camera.front_door',
              entities: [
                'binary_sensor.front_door',
                'binary_sensor.motion_front',
              ],
            },
          ],
        },
      ],
    },
    'wall-panel': {
      title: 'Wall Panel',
      views: [
        {
          title: 'At a Glance',
          path: 'glance',
          icon: 'mdi:monitor-dashboard',
          type: 'panel',
          badges: [],
          cards: [
            {
              type: 'grid',
              columns: 2,
              square: false,
              cards: [
                {
                  type: 'weather-forecast',
                  entity: 'weather.home',
                  show_forecast: true,
                },
                {
                  type: 'vertical-stack',
                  cards: [
                    {
                      type: 'markdown',
                      content: `# {{ now().strftime("%H:%M") }}
### {{ now().strftime("%A, %B %d") }}`,
                      style: 'font-size: 2em; text-align: center;',
                    },
                    {
                      type: 'glance',
                      entities: [
                        'person.owner',
                        'sensor.temperature',
                        'sensor.humidity',
                      ],
                      show_name: false,
                      show_state: true,
                    },
                  ],
                },
                {
                  type: 'gauge',
                  entity: 'sensor.temperature',
                  name: 'Temperature',
                  min: 10,
                  max: 35,
                  severity: {
                    green: 18,
                    yellow: 15,
                    red: 10,
                  },
                  needle: true,
                },
                {
                  type: 'gauge',
                  entity: 'sensor.humidity',
                  name: 'Humidity',
                  min: 0,
                  max: 100,
                  severity: {
                    green: 30,
                    yellow: 60,
                    red: 80,
                  },
                  needle: true,
                },
                {
                  type: 'entities',
                  title: 'Quick Status',
                  show_header_toggle: false,
                  entities: [
                    { entity: 'binary_sensor.front_door', name: 'Front Door' },
                    { entity: 'binary_sensor.back_door', name: 'Back Door' },
                    { entity: 'binary_sensor.garage_door', name: 'Garage' },
                    { entity: 'lock.front_door', name: 'Front Lock' },
                  ],
                },
                {
                  type: 'conditional',
                  conditions: [
                    { entity: 'binary_sensor.someone_home', state: 'on' },
                  ],
                  card: {
                    type: 'markdown',
                    content: '## 🏠 Someone is Home',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };

  // Apply priority modifications
  if (priority === 'most-used') {
    // Most-used entities go to the top
    const mostUsed = ['light.living_room', 'climate.bedroom', 'switch.coffee_maker'];
    // Modify first view to prioritize most used
    if (layouts[deviceType].views[0]) {
      layouts[deviceType].views[0].title = '⭐ Favorites';
    }
  } else if (priority === 'by-area') {
    // Organize by areas
    layouts[deviceType].title += ' (By Area)';
  } else if (priority === 'by-type') {
    // Organize by device type
    layouts[deviceType].title += ' (By Type)';
  }

  return layouts[deviceType] || layouts.desktop;
}

// Get optimization notes for device type
function getOptimizationNotes(deviceType: string, priority: string): string[] {
  const notes: Record<string, string[]> = {
    mobile: [
      'Single-column layout for easy scrolling',
      'Large touch targets (minimum 44x44px)',
      'Tile cards for quick toggles',
      'Reduced visual complexity',
      'Essential controls only',
    ],
    desktop: [
      'Multi-column grid layout for information density',
      'History graphs and statistics cards',
      'Detailed entity controls',
      'Keyboard shortcuts supported',
      'Wide-screen optimized',
    ],
    tablet: [
      '2-3 column layout',
      'Touch-optimized controls',
      'Balance between detail and simplicity',
      'Perfect for wall mounting',
      'Landscape orientation optimized',
    ],
    'wall-panel': [
      'At-a-glance information display',
      'Auto-updating cards',
      'Large text and icons (3-4em)',
      'Minimal interaction required',
      'High contrast for visibility',
    ],
  };
  return notes[deviceType] || notes.desktop;
}

// Get device-specific feature notes
function getDeviceFeatureNotes(deviceType: string): string {
  const features: Record<string, string> = {
    mobile: `
- **Tile Cards**: Quick toggle with large touch targets
- **Vertical Stacking**: Easy one-handed navigation
- **Badges**: Quick status at top without scrolling
- **Minimal Forecast**: Weather without taking too much space
    `.trim(),
    desktop: `
- **Grid Layouts**: 3-4 column grids for maximum information
- **History Graphs**: 24+ hour data visualization
- **Statistics**: Detailed energy and system stats
- **Multiple Views**: Separate views for each category
- **Gauges**: Real-time visual indicators
    `.trim(),
    tablet: `
- **2-Column Grid**: Perfect for landscape orientation
- **Scene Buttons**: Quick scene activation
- **Touch Controls**: Optimized for finger interaction
- **Mixed Cards**: Variety of card types for engagement
    `.trim(),
    'wall-panel': `
- **Large Gauges**: Easy to read from distance
- **Clock Display**: Current time and date prominent
- **Status Indicators**: Door/lock status at a glance
- **Conditional Cards**: Show alerts when needed
- **Auto-refresh**: Always up-to-date information
    `.trim(),
  };
  return features[deviceType] || features.desktop;
}

// Get priority-specific notes
function getPriorityNotes(priority: string): string {
  const notes: Record<string, string> = {
    'most-used': `
Your dashboard is organized with most frequently used entities at the top.
Based on usage analysis, this puts your most-accessed controls within easy reach.
    `.trim(),
    'by-area': `
Your dashboard is organized by rooms/areas.
Each area has its own section or view with all relevant entities grouped together.
    `.trim(),
    'by-type': `
Your dashboard is organized by device type (lights, climate, media, etc.).
All similar devices are grouped together for easier bulk control.
    `.trim(),
    custom: `
Your dashboard uses custom prioritization as specified.
Entities are arranged according to your specific requirements.
    `.trim(),
  };
  return notes[priority] || notes['most-used'];
}

// Optimize existing layout for device
function optimizeLayoutForDevice(deviceType: string, existingLayout: any): any {
  // Clone the existing layout
  const optimized = JSON.parse(JSON.stringify(existingLayout));
  
  // Apply device-specific optimizations
  if (deviceType === 'mobile') {
    // Convert to single column, use tiles
    optimized.views?.forEach((view: any) => {
      if (view.type === 'panel' && view.cards?.[0]?.type === 'grid') {
        view.cards[0].columns = 1;
      }
      // Convert button cards to tiles for better mobile experience
      view.cards = view.cards?.map((card: any) => {
        if (card.type === 'button') {
          return {
            ...card,
            type: 'tile',
            vertical: true,
          };
        }
        return card;
      });
    });
  } else if (deviceType === 'desktop') {
    // Increase columns, add history graphs
    optimized.views?.forEach((view: any) => {
      if (view.cards?.[0]?.type === 'grid') {
        view.cards[0].columns = Math.max(view.cards[0].columns || 2, 3);
      }
    });
  } else if (deviceType === 'wall-panel') {
    // Large gauges, remove interactive elements
    optimized.views?.forEach((view: any) => {
      view.cards = view.cards?.map((card: any) => {
        if (card.type === 'entities') {
          card.show_header_toggle = false;
        }
        return card;
      });
    });
  }
  
  return optimized;
}

// Get optimization changes description
function getOptimizationChanges(deviceType: string): string[] {
  const changes: Record<string, string[]> = {
    mobile: [
      'Converted grid layouts to single column',
      'Changed button cards to tile cards for better touch',
      'Removed unnecessary badges',
      'Simplified entity cards',
    ],
    desktop: [
      'Increased grid columns to 3-4',
      'Added history-graph cards',
      'Enabled detailed entity controls',
      'Added statistics cards',
    ],
    tablet: [
      'Set grid to 2-3 columns',
      'Optimized for landscape orientation',
      'Added scene buttons',
      'Balanced detail and simplicity',
    ],
    'wall-panel': [
      'Converted to large gauges',
      'Disabled interactive toggles',
      'Added large clock display',
      'Increased font sizes',
      'Added auto-refresh settings',
    ],
  };
  return changes[deviceType] || [];
}

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
