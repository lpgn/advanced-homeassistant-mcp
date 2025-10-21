/**
 * Prompt Handler - Generates guided conversation content for MCP prompts
 */

import { get_hass } from '../hass/index.js';
import { logger } from '../utils/logger.js';

export interface PromptResponse {
    title: string;
    content: string;
    suggestions?: string[];
}

/**
 * Generate content for create_automation prompt
 */
export async function generateCreateAutomationPrompt(triggerType?: string): Promise<PromptResponse> {
    const type = triggerType || 'general';
    
    let content = `# Creating a Home Assistant Automation

I'll help you create an automation step-by-step. An automation has three main parts:

## 1. Trigger (When)
What should start this automation?
`;

    if (type === 'time' || type === 'general') {
        content += `\n### Time-based triggers:
- Specific time (e.g., 7:00 AM)
- Sunrise/sunset
- Every X minutes/hours`;
    }

    if (type === 'state' || type === 'general') {
        content += `\n### State change triggers:
- Entity changes state (e.g., motion detected, door opened)
- Entity attribute changes
- Numeric state crosses threshold (e.g., temperature > 25°C)`;
    }

    if (type === 'event' || type === 'general') {
        content += `\n### Event triggers:
- Home Assistant events
- Webhook calls
- MQTT messages`;
    }

    content += `\n\n## 2. Condition (If)
Optional checks that must be true:
- Time range (e.g., only between 6 AM - 10 PM)
- Entity state (e.g., only if someone is home)
- Day of week
- Numeric comparisons

## 3. Action (Then)
What should happen:
- Turn on/off devices
- Send notifications
- Call services
- Wait/delay
- Choose between options

## Next Steps:
Tell me what you want to automate, and I'll help you build it!`;

    return {
        title: "Automation Creation Guide",
        content,
        suggestions: [
            "I want to turn on lights at sunset",
            "I want to get notified when someone arrives home",
            "I want to turn off everything when I leave",
            "I want temperature-based climate control"
        ]
    };
}

/**
 * Generate content for debug_automation prompt
 */
export async function generateDebugAutomationPrompt(automationId: string): Promise<PromptResponse> {
    try {
        const hass = await get_hass();
        const state = await hass.getState(automationId);
        
        if (!state) {
            return {
                title: "Automation Not Found",
                content: `Could not find automation: ${automationId}\n\nPlease check the entity_id is correct.`,
            };
        }

        const attrs = state.attributes || {};
        const lastTriggered = attrs.last_triggered || 'Never';
        const mode = attrs.mode || 'single';
        const currentRuns = attrs.current || 0;

        let content = `# Debugging: ${attrs.friendly_name || automationId}

## Current Status
- State: ${state.state}
- Last Triggered: ${lastTriggered}
- Mode: ${mode}
- Current Runs: ${currentRuns}

## Common Issues to Check:

### 1. Is the automation enabled?
${state.state === 'on' ? '✓ Yes, automation is ON' : '✗ No, automation is OFF - turn it on first!'}

### 2. When was it last triggered?
${lastTriggered === 'Never' ? '✗ Never triggered - check if trigger conditions are being met' : `✓ Last triggered: ${lastTriggered}`}

### 3. Check trigger entities
Look at the automation's trigger configuration and verify:
- Are the trigger entities available and responding?
- Are the trigger conditions realistic?
- Is the time-based trigger configured correctly?

### 4. Check conditions
If you have conditions, verify:
- Are all condition entities available?
- Are the conditions too restrictive?
- Try temporarily removing conditions to test

### 5. Check actions
Verify the actions:
- Are all target entities available and responding?
- Do the services exist?
- Are the parameters correct?

## Next Steps:
Would you like me to:
1. Check the state of entities used in this automation?
2. Review the automation configuration?
3. Look at recent Home Assistant logs for errors?
4. Test the automation manually?`;

        return {
            title: `Debugging ${attrs.friendly_name || automationId}`,
            content,
            suggestions: [
                "Check entities used in this automation",
                "Show me the automation configuration",
                "Look for related errors in logs",
                "Trigger this automation manually"
            ]
        };
    } catch (error) {
        logger.error(`Error generating debug prompt: ${error}`);
        return {
            title: "Error",
            content: `Failed to retrieve automation information: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Generate content for troubleshoot_entity prompt
 */
export async function generateTroubleshootEntityPrompt(entityId: string): Promise<PromptResponse> {
    try {
        const hass = await get_hass();
        const state = await hass.getState(entityId);
        
        if (!state) {
            return {
                title: "Entity Not Found",
                content: `Could not find entity: ${entityId}\n\nThe entity might be:\n- Disabled\n- Removed\n- Have a different entity_id\n\nCheck your entity list for similar names.`,
            };
        }

        const attrs = state.attributes || {};
        const domain = entityId.split('.')[0];
        const lastChanged = state.last_changed || 'Unknown';
        const lastUpdated = state.last_updated || 'Unknown';

        let content = `# Troubleshooting: ${attrs.friendly_name || entityId}

## Current Status
- Entity ID: ${entityId}
- Domain: ${domain}
- State: ${state.state}
- Last Changed: ${lastChanged}
- Last Updated: ${lastUpdated}

## Entity Information
${JSON.stringify(attrs, null, 2)}

## Common Issues by Domain:

`;

        switch (domain) {
            case 'light':
                content += `### Light Troubleshooting
- Is the physical switch on?
- Is the bulb working?
- Is the integration connected?
- Try: Turn off and on again
- Check: Power supply and network connectivity`;
                break;
            case 'sensor':
                content += `### Sensor Troubleshooting
- When was it last updated? ${lastUpdated}
- Is the value changing? ${state.state === 'unavailable' ? '✗ Unavailable' : '✓ Reading: ' + state.state}
- Battery level: ${attrs.battery_level || 'N/A'}
- Check: Device connectivity and battery`;
                break;
            case 'switch':
                content += `### Switch Troubleshooting
- Physical device responding?
- Integration connected?
- Recent state changes? ${lastChanged}
- Try: Toggle switch manually`;
                break;
            case 'climate':
                content += `### Climate Troubleshooting
- Current temp: ${attrs.current_temperature || 'N/A'}
- Target temp: ${attrs.temperature || 'N/A'}
- HVAC mode: ${attrs.hvac_mode || 'N/A'}
- Check: Thermostat is powered and connected`;
                break;
            default:
                content += `### General Troubleshooting
- Entity state: ${state.state}
- Check integration logs for errors
- Verify device connectivity
- Restart integration if needed`;
        }

        content += `\n\n## Next Steps:
What would you like me to help with?`;

        return {
            title: `Troubleshooting ${attrs.friendly_name || entityId}`,
            content,
            suggestions: [
                "Check the entity's history",
                "Look for related error logs",
                "Reload the integration",
                "Test the entity manually"
            ]
        };
    } catch (error) {
        logger.error(`Error generating troubleshoot prompt: ${error}`);
        return {
            title: "Error",
            content: `Failed to retrieve entity information: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Generate content for routine_optimizer prompt
 */
export async function generateRoutineOptimizerPrompt(area?: string, days?: string): Promise<PromptResponse> {
    const analyzeDays = days ? parseInt(days) : 7;
    const areaFilter = area || 'all areas';

    const content = `# Routine Optimization Analysis

I'll analyze your Home Assistant usage patterns over the last ${analyzeDays} days for ${areaFilter}.

## What I'll Look For:

### 1. Daily Patterns
- When do lights typically turn on/off?
- Regular temperature adjustments
- Consistent device usage times

### 2. Automation Opportunities
- Repetitive manual actions that could be automated
- Predictable behavior patterns
- Seasonal adjustments

### 3. Energy Efficiency
- Devices left on unnecessarily
- Heating/cooling optimization opportunities
- Standby power usage

### 4. Convenience Improvements
- Common action sequences that could be combined
- "Good morning" and "Good night" routines
- Away-from-home automations

## Analysis Method:
I'll review entity history to identify:
- Most frequently controlled devices
- Common time patterns
- Repeated action sequences
- Energy usage patterns

## Next Steps:
Let me analyze your ${areaFilter} usage. This may take a moment...

Would you like me to start the analysis?`;

    return {
        title: "Routine Optimization",
        content,
        suggestions: [
            "Yes, analyze my routines",
            "Focus on bedroom only",
            "Look for energy savings",
            "Show me morning routine patterns"
        ]
    };
}

/**
 * Generate content for automation_health_check prompt
 */
export async function generateAutomationHealthCheckPrompt(): Promise<PromptResponse> {
    try {
        const hass = await get_hass();
        const states = await hass.getStates();
        const automations = states.filter(s => s.entity_id.startsWith('automation.'));

        const content = `# Automation Health Check

I'll review all ${automations.length} automations in your system.

## What I'll Check:

### 1. Automation Status
- Which automations are disabled?
- Which have never triggered?
- Which trigger most frequently?

### 2. Potential Conflicts
- Overlapping triggers (multiple automations with same trigger)
- Competing actions (automations that might fight each other)
- Resource conflicts (e.g., two automations controlling same entity)

### 3. Optimization Opportunities
- Redundant automations that could be combined
- Overly complex automations that could be simplified
- Missing error handling

### 4. Best Practices
- Proper naming conventions
- Appropriate modes (single, restart, parallel)
- Timeout settings
- Conditions usage

### 5. Performance
- Long-running automations
- Frequently triggered automations
- Resource-intensive actions

## Current Automation Summary:
- Total automations: ${automations.length}
- Enabled: ${automations.filter(a => a.state === 'on').length}
- Disabled: ${automations.filter(a => a.state === 'off').length}

Let me perform the full health check...`;

        return {
            title: "Automation Health Check",
            content,
            suggestions: [
                "Start the health check",
                "Show disabled automations",
                "Find never-triggered automations",
                "Check for conflicts"
            ]
        };
    } catch (error) {
        logger.error(`Error generating health check prompt: ${error}`);
        return {
            title: "Error",
            content: `Failed to retrieve automation information: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Generate content for entity_naming_consistency prompt
 */
export async function generateEntityNamingPrompt(domain?: string): Promise<PromptResponse> {
    try {
        const hass = await get_hass();
        const states = await hass.getStates();
        const entities = domain ? states.filter(s => s.entity_id.startsWith(domain + '.')) : states;

        const content = `# Entity Naming Consistency Audit

Analyzing ${entities.length} entities${domain ? ` in domain: ${domain}` : ''}.

## Naming Best Practices:

### 1. Consistency
- Use consistent patterns (e.g., area_room_device)
- Standardize abbreviations
- Avoid mixing formats

### 2. Clarity
- Descriptive names
- Avoid generic names like "light_1"
- Include location information

### 3. Organization
- Group related entities
- Use prefixes for organization
- Consistent capitalization

## Common Issues I'll Look For:

### Format Inconsistencies
- Mixed separators (underscore vs dash)
- Inconsistent capitalization
- Random suffixes/prefixes

### Naming Problems
- Generic names (light_1, switch_2)
- Unclear locations
- Duplicate names
- Special characters

### Organization Issues
- Ungrouped related entities
- Missing area assignments
- Poor categorization

## Example Improvements:
❌ light_1, Light_kitchen, lr_light
✓ kitchen_light, kitchen_counter_light, living_room_main_light

Let me analyze your entities...`;

        return {
            title: "Entity Naming Audit",
            content,
            suggestions: [
                "Start the naming audit",
                "Focus on lights only",
                "Show worst naming issues",
                "Suggest renaming plan"
            ]
        };
    } catch (error) {
        logger.error(`Error generating naming prompt: ${error}`);
        return {
            title: "Error",
            content: `Failed to retrieve entity information: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Generate content for dashboard_layout_generator prompt
 */
export async function generateDashboardLayoutPrompt(dashboardType?: string, priority?: string): Promise<PromptResponse> {
    const type = dashboardType || 'mobile';
    const priorityType = priority || 'most_used';

    const content = `# Dashboard Layout Generator

Creating an optimized ${type} dashboard layout with ${priorityType} priority.

## Dashboard Types:

### Mobile
- Single column layout
- Large touch targets
- Essential controls only
- Quick access to favorites

### Desktop
- Multi-column layout
- More detailed cards
- Graphs and statistics
- Advanced controls

### Tablet
- 2-3 column layout
- Balance of detail and simplicity
- Touch-optimized
- Good for wall mount

### Wall Panel
- At-a-glance information
- Large text and icons
- Auto-updating cards
- Minimal interaction needed

## Layout Priorities:

### Most Used
- Analyze usage patterns
- Place frequently accessed entities at top
- Quick actions prominently displayed

### By Area
- Group by room/area
- Logical flow through home
- Area-specific controls

### By Type
- Group similar devices
- All lights together
- All climate controls together

### Custom
- You specify the priorities
- Flexible arrangement
- Mixed groupings

## I'll Create:
1. Recommended card layout
2. Entity groupings
3. View organization
4. Mobile vs desktop variations
5. YAML configuration

Ready to generate your dashboard?`;

    return {
        title: "Dashboard Layout Generator",
        content,
        suggestions: [
            "Generate the dashboard layout",
            "Show me popular card types",
            "Create a mobile-first design",
            "Design a wall panel dashboard"
        ]
    };
}

/**
 * Main prompt handler - routes to appropriate generator
 */
export async function handlePrompt(promptName: string, args?: Record<string, string>): Promise<PromptResponse> {
    switch (promptName) {
        case 'create_automation':
            return generateCreateAutomationPrompt(args?.trigger_type);
        
        case 'debug_automation':
            if (!args?.automation_id) {
                return {
                    title: "Missing Parameter",
                    content: "Please provide an automation_id parameter (e.g., automation.morning_lights)",
                };
            }
            return generateDebugAutomationPrompt(args.automation_id);
        
        case 'troubleshoot_entity':
            if (!args?.entity_id) {
                return {
                    title: "Missing Parameter",
                    content: "Please provide an entity_id parameter (e.g., light.living_room)",
                };
            }
            return generateTroubleshootEntityPrompt(args.entity_id);
        
        case 'routine_optimizer':
            return generateRoutineOptimizerPrompt(args?.area, args?.days);
        
        case 'automation_health_check':
            return generateAutomationHealthCheckPrompt();
        
        case 'entity_naming_consistency':
            return generateEntityNamingPrompt(args?.domain);
        
        case 'dashboard_layout_generator':
            return generateDashboardLayoutPrompt(args?.dashboard_type, args?.priority);
        
        default:
            return {
                title: "Unknown Prompt",
                content: `Prompt "${promptName}" not found. Available prompts: create_automation, debug_automation, troubleshoot_entity, routine_optimizer, automation_health_check, entity_naming_consistency, dashboard_layout_generator`,
            };
    }
}
