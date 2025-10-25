import { z } from 'zod';

/**
 * Guided prompts for common Home Assistant tasks
 * These prompts provide AI-guided conversations for complex operations
 */

export const createAutomationPrompt = {
  name: 'create_automation_guide',
  description: 'Interactive guide for creating Home Assistant automations. Walks through trigger selection, conditions, and actions with examples and best practices.',
  parameters: z.object({
    trigger_type: z.enum(['time', 'state', 'event', 'numeric_state', 'zone', 'device', 'webhook', 'template']).optional().describe('Type of trigger to create (optional, will guide if not provided)'),
  }),
  execute: async (params: { trigger_type?: string }) => {
    const triggerType = params.trigger_type || 'unspecified';
    
    const guides: Record<string, any> = {
      time: {
        description: 'Time-based triggers activate automations at specific times',
        examples: [
          { trigger: { platform: 'time', at: '07:00:00' }, use_case: 'Morning routine at 7 AM' },
          { trigger: { platform: 'time_pattern', hours: '/2' }, use_case: 'Every 2 hours' },
          { trigger: { platform: 'sun', event: 'sunset' }, use_case: 'At sunset' },
        ],
        best_practices: [
          'Use time_pattern for recurring intervals',
          'Consider sun events for outdoor lighting',
          'Account for timezone differences',
        ],
      },
      state: {
        description: 'State triggers activate when an entity changes state',
        examples: [
          { trigger: { platform: 'state', entity_id: 'binary_sensor.motion', to: 'on' }, use_case: 'Motion detected' },
          { trigger: { platform: 'state', entity_id: 'device_tracker.phone', to: 'home', for: '00:05:00' }, use_case: 'Phone home for 5 minutes' },
        ],
        best_practices: [
          'Use "for" duration to avoid false triggers',
          'Specify both "from" and "to" for precise control',
          'Consider using binary_sensor for on/off states',
        ],
      },
      numeric_state: {
        description: 'Numeric state triggers activate based on numeric sensor values',
        examples: [
          { trigger: { platform: 'numeric_state', entity_id: 'sensor.temperature', above: 25 }, use_case: 'Temperature above 25°C' },
          { trigger: { platform: 'numeric_state', entity_id: 'sensor.humidity', below: 30 }, use_case: 'Low humidity alert' },
        ],
        best_practices: [
          'Use value_template for complex calculations',
          'Add hysteresis to prevent bouncing',
          'Consider using both above and below for ranges',
        ],
      },
    };

    const guide = guides[triggerType] || {
      description: 'Select a trigger type to get started',
      available_types: Object.keys(guides),
      recommendation: 'Start with the most common: time (scheduled) or state (when something changes)',
    };

    return {
      success: true,
      guide_type: 'create_automation',
      trigger_type: triggerType,
      guide,
      automation_template: {
        alias: 'My Automation',
        description: 'Automation created with guide',
        mode: 'single',
        trigger: [],
        condition: [],
        action: [],
      },
      next_steps: [
        '1. Choose your trigger type',
        '2. Define conditions (optional)',
        '3. Specify actions to perform',
        '4. Use automation_config tool to create the automation',
      ],
      tips: {
        testing: 'Test automations with the trace feature in Home Assistant UI',
        debugging: 'Check logs if automation doesn\'t trigger as expected',
        organization: 'Use descriptive aliases and add comments',
        safety: 'Start with simple automations and gradually add complexity',
      },
    };
  },
};

export const debugAutomationPrompt = {
  name: 'debug_automation_guide',
  description: 'Troubleshooting guide for automations that aren\'t working. Checks triggers, conditions, actions, and entity availability.',
  parameters: z.object({
    automation_id: z.string().describe('The automation entity ID to troubleshoot (e.g., "automation.morning_routine")'),
  }),
  execute: async (params: { automation_id: string }) => {
    return {
      success: true,
      guide_type: 'debug_automation',
      automation_id: params.automation_id,
      checklist: {
        trigger_checks: [
          'Is the automation enabled? (Check state is not "off")',
          'Are triggers configured correctly?',
          'For time triggers: Is the time zone correct?',
          'For state triggers: Is the entity available and updating?',
          'For numeric triggers: Are thresholds properly set?',
        ],
        condition_checks: [
          'Are conditions too restrictive?',
          'Check condition evaluation order',
          'Verify entity states in conditions',
          'Consider time-based conditions (e.g., weekday)',
          'Test with conditions temporarily disabled',
        ],
        action_checks: [
          'Are target entities available?',
          'Do services have required parameters?',
          'Check action delays and sequences',
          'Verify template syntax if using templates',
          'Test actions manually with developer tools',
        ],
        system_checks: [
          'Check Home Assistant logs for errors',
          'Verify integration is loaded and working',
          'Check entity permissions',
          'Review recent HA updates (breaking changes)',
          'Check system resources (CPU, memory)',
        ],
      },
      debugging_steps: [
        '1. Get automation using automation_config tool (action: get)',
        '2. Check each trigger condition individually',
        '3. Use trace feature in HA UI to see execution path',
        '4. Test actions separately using service_call tool',
        '5. Review automation history using get_history tool',
      ],
      common_issues: {
        not_triggering: [
          'Entity ID changed or entity unavailable',
          'Condition blocking execution',
          'Automation disabled',
          'Trigger threshold not met',
        ],
        triggering_repeatedly: [
          'Missing "for" duration in trigger',
          'State oscillating rapidly',
          'Mode set to "queued" or "parallel"',
          'Action causing trigger (loop)',
        ],
        action_not_executing: [
          'Target entity unavailable',
          'Service not found or deprecated',
          'Missing required parameters',
          'Template error',
        ],
      },
    };
  },
};

export const troubleshootEntityPrompt = {
  name: 'troubleshoot_entity_guide',
  description: 'Diagnose issues with entities that aren\'t working properly. Checks entity status, integration, connectivity, and configuration.',
  parameters: z.object({
    entity_id: z.string().describe('The entity ID having issues (e.g., "sensor.temperature")'),
  }),
  execute: async (params: { entity_id: string }) => {
    return {
      success: true,
      guide_type: 'troubleshoot_entity',
      entity_id: params.entity_id,
      diagnostic_steps: [
        {
          step: 1,
          action: 'Check Entity Status',
          tools: ['get_entity with detailed=true', 'get_history for recent changes'],
          what_to_look_for: [
            'State: Is it "unavailable" or "unknown"?',
            'Last updated: Is it updating regularly?',
            'Attributes: Are expected attributes present?',
            'State class: Proper for entity type?',
          ],
        },
        {
          step: 2,
          action: 'Verify Integration',
          tools: ['system_overview to see loaded integrations'],
          what_to_look_for: [
            'Is integration loaded?',
            'Check integration version',
            'Review integration setup in HA UI',
            'Check for known issues with integration',
          ],
        },
        {
          step: 3,
          action: 'Check Device Connectivity',
          tools: ['list_devices to see device status'],
          what_to_look_for: [
            'Device online/offline status',
            'Last communication time',
            'Signal strength (if wireless)',
            'Battery level (if battery-powered)',
          ],
        },
        {
          step: 4,
          action: 'Review Configuration',
          tools: ['get_entity to check current config'],
          what_to_look_for: [
            'Entity customization settings',
            'Unit of measurement',
            'Device class',
            'Icon and friendly name',
          ],
        },
        {
          step: 5,
          action: 'Check Error Logs',
          tools: ['error_log tool'],
          what_to_look_for: [
            'Recent errors mentioning entity',
            'Integration-specific errors',
            'Communication timeouts',
            'Configuration errors',
          ],
        },
      ],
      common_solutions: {
        unavailable: [
          'Reload integration from HA UI',
          'Check device power and connectivity',
          'Restart Home Assistant',
          'Re-pair device if wireless',
          'Check network connectivity',
        ],
        not_updating: [
          'Check polling interval settings',
          'Verify device is sending data',
          'Check for integration rate limits',
          'Review entity recorder settings',
        ],
        wrong_values: [
          'Check unit conversion settings',
          'Verify device calibration',
          'Review entity customization',
          'Check template sensor logic',
        ],
        missing_attributes: [
          'Update integration to latest version',
          'Check device firmware version',
          'Review entity customization',
          'Check integration configuration',
        ],
      },
      next_actions: [
        'Use get_entity tool with detailed=true',
        'Check get_history for pattern analysis',
        'Review error_log for related issues',
        'Test entity manually in Developer Tools',
      ],
    };
  },
};

export const routineOptimizerPrompt = {
  name: 'routine_optimizer_guide',
  description: 'Analyze usage patterns and suggest optimized routines based on actual behavior. Reviews entity histories to identify patterns and create efficient automations.',
  parameters: z.object({
    analyze_hours: z.number().optional().default(168).describe('Hours of history to analyze (default: 168 = 7 days)'),
  }),
  execute: async (params: { analyze_hours?: number }) => {
    return {
      success: true,
      guide_type: 'routine_optimizer',
      analysis_period: `${params.analyze_hours || 168} hours`,
      optimization_approach: {
        data_collection: [
          'Get history for key entities (lights, climate, media)',
          'Identify usage patterns by time of day',
          'Find correlations between different devices',
          'Detect routine activities',
        ],
        pattern_analysis: [
          'Morning routine: When do lights typically turn on?',
          'Evening routine: When does activity wind down?',
          'Weekend vs weekday differences',
          'Seasonal variations',
        ],
        optimization_opportunities: [
          'Predictive automations based on detected patterns',
          'Energy-saving schedules',
          'Comfort optimization (climate, lighting)',
          'Consolidate redundant automations',
        ],
      },
      analysis_steps: [
        {
          step: 1,
          task: 'Identify Key Entities',
          description: 'List most-used devices and sensors',
          tool: 'list_devices with usage statistics',
        },
        {
          step: 2,
          task: 'Collect Historical Data',
          description: 'Get state changes for analysis period',
          tool: 'get_history for each entity',
        },
        {
          step: 3,
          task: 'Identify Patterns',
          description: 'Find recurring behaviors and correlations',
          analysis: [
            'Time-based patterns (hourly, daily, weekly)',
            'Sequence patterns (A always follows B)',
            'Conditional patterns (A happens when B is true)',
          ],
        },
        {
          step: 4,
          task: 'Generate Recommendations',
          description: 'Create automation suggestions',
          output: 'Automation configurations ready to implement',
        },
      ],
      example_optimizations: [
        {
          pattern: 'Lights turn on at 7 AM Mon-Fri, 9 AM weekends',
          recommendation: 'Create time-based automation with weekday condition',
          config: {
            alias: 'Morning Lights',
            trigger: [
              { platform: 'time', at: '07:00:00' },
            ],
            condition: [
              { condition: 'time', weekday: ['mon', 'tue', 'wed', 'thu', 'fri'] },
            ],
            action: [
              { service: 'light.turn_on', target: { entity_id: 'light.bedroom' } },
            ],
          },
        },
        {
          pattern: 'Climate set to 22°C when arriving home',
          recommendation: 'Presence-based climate automation',
          config: {
            alias: 'Arrival Climate',
            trigger: [
              { platform: 'state', entity_id: 'person.user', to: 'home' },
            ],
            action: [
              { service: 'climate.set_temperature', data: { temperature: 22 }, target: { entity_id: 'climate.living_room' } },
            ],
          },
        },
      ],
      energy_saving_tips: [
        'Turn off lights in unoccupied rooms',
        'Lower heating/cooling when away',
        'Schedule high-energy devices during off-peak hours',
        'Use motion sensors for automatic control',
      ],
    };
  },
};

export const automationHealthCheckPrompt = {
  name: 'automation_health_check_guide',
  description: 'Review all automations for conflicts, redundancies, and improvement opportunities. Performs comprehensive audit of automation system.',
  parameters: z.object({}),
  execute: async () => {
    return {
      success: true,
      guide_type: 'automation_health_check',
      audit_categories: {
        conflicts: {
          description: 'Automations that may interfere with each other',
          checks: [
            'Multiple automations controlling same entity',
            'Opposing actions (one turns on, another turns off)',
            'Race conditions (simultaneous triggers)',
            'Priority conflicts',
          ],
          example: 'Automation A turns light on at sunset, Automation B turns it off at 7 PM (sunset might be after 7 PM)',
        },
        redundancies: {
          description: 'Duplicate or overlapping automations',
          checks: [
            'Identical triggers with similar actions',
            'Multiple automations for same purpose',
            'Superseded automations (newer version exists)',
            'Unused automations',
          ],
          recommendation: 'Consolidate into single, well-structured automation',
        },
        inefficiencies: {
          description: 'Automations that could be optimized',
          checks: [
            'Frequent trigger evaluations (resource intensive)',
            'Complex templates that could be simplified',
            'Polling when webhooks available',
            'Redundant condition checks',
          ],
          optimization: 'Use efficient trigger types, simplify logic, cache values',
        },
        missing_safeguards: {
          description: 'Automations lacking safety conditions',
          checks: [
            'No rate limiting on repeating actions',
            'Missing presence conditions',
            'No time-of-day restrictions',
            'Lack of state validation',
          ],
          recommendation: 'Add conditions to prevent unwanted behavior',
        },
      },
      review_process: [
        {
          phase: 'Discovery',
          task: 'List all automations',
          tool: 'automation tool with action: list',
          output: 'Complete automation inventory',
        },
        {
          phase: 'Analysis',
          task: 'Review each automation configuration',
          tool: 'automation_config tool for each automation',
          checks: ['Trigger types', 'Condition complexity', 'Action sequences', 'Mode setting'],
        },
        {
          phase: 'Conflict Detection',
          task: 'Identify potential conflicts',
          method: 'Compare triggers and actions across all automations',
          look_for: 'Same entities in different automation actions',
        },
        {
          phase: 'Optimization',
          task: 'Generate improvement suggestions',
          output: 'Prioritized list of recommendations',
        },
      ],
      best_practices: {
        organization: [
          'Use descriptive aliases',
          'Add descriptions explaining purpose',
          'Group related automations with prefixes',
          'Document complex logic',
        ],
        structure: [
          'Choose appropriate mode (single/restart/queued/parallel)',
          'Use conditions to prevent false triggers',
          'Implement proper delays in sequences',
          'Validate entity states before actions',
        ],
        maintenance: [
          'Regular health checks (monthly/quarterly)',
          'Test after Home Assistant updates',
          'Review automation traces',
          'Keep automations simple when possible',
        ],
      },
      tools_needed: [
        'automation (list all)',
        'automation_config (get details)',
        'get_history (check execution history)',
        'error_log (check for automation errors)',
      ],
    };
  },
};

// Export all prompts
export const guidedPrompts = {
  createAutomationPrompt,
  debugAutomationPrompt,
  troubleshootEntityPrompt,
  routineOptimizerPrompt,
  automationHealthCheckPrompt,
};
