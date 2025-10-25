/**
 * MCP Prompts for Guided Conversations
 * 
 * These prompts provide structured guidance for common Home Assistant tasks
 */

export interface Prompt {
    name: string;
    description: string;
    arguments?: Array<{
        name: string;
        description: string;
        required: boolean;
    }>;
    load?: (args?: Record<string, string>) => Promise<any>;
}

export const prompts: Prompt[] = [
    {
        name: "create_automation",
        description: "Guide for creating Home Assistant automations. Helps you build automations step-by-step based on trigger type (time, state change, event, etc.)",
        arguments: [
            {
                name: "trigger_type",
                description: "Type of trigger: time, state, event, webhook, or manual",
                required: false
            }
        ]
    },
    {
        name: "debug_automation",
        description: "Troubleshooting help for automations that aren't working. Analyzes automation configuration, checks entity states, reviews logs, and suggests fixes.",
        arguments: [
            {
                name: "automation_id",
                description: "The entity_id of the automation to debug (e.g., automation.morning_lights)",
                required: true
            }
        ]
    },
    {
        name: "troubleshoot_entity",
        description: "Diagnose issues with entities. Checks entity state, attributes, last updated time, and suggests common fixes.",
        arguments: [
            {
                name: "entity_id",
                description: "The entity_id to troubleshoot (e.g., light.living_room)",
                required: true
            }
        ]
    },
    {
        name: "routine_optimizer",
        description: "Analyze usage patterns and suggest optimized routines based on actual behavior. Reviews entity history to identify patterns and recommend automations.",
        arguments: [
            {
                name: "area",
                description: "Focus on a specific area (e.g., bedroom, living_room) or 'all' for entire home",
                required: false
            },
            {
                name: "days",
                description: "Number of days of history to analyze (default: 7)",
                required: false
            }
        ]
    },
    {
        name: "automation_health_check",
        description: "Review all automations to find conflicts, redundancies, or improvement opportunities. Identifies overlapping triggers, unused automations, and optimization suggestions.",
    },
    {
        name: "entity_naming_consistency",
        description: "Audit entity names and suggest standardization improvements. Helps maintain consistent naming conventions across your Home Assistant setup.",
        arguments: [
            {
                name: "domain",
                description: "Focus on specific domain (e.g., light, switch, sensor) or 'all'",
                required: false
            }
        ]
    },
    {
        name: "dashboard_layout_generator",
        description: "Create optimized dashboard layouts based on user preferences and usage patterns. Suggests card arrangements and groupings.",
        arguments: [
            {
                name: "dashboard_type",
                description: "Type of dashboard: mobile, desktop, tablet, or wall_panel",
                required: false
            },
            {
                name: "priority",
                description: "What to prioritize: most_used, by_area, by_type, or custom",
                required: false
            }
        ]
    },
    {
        name: "energy_optimization",
        description: "Analyze energy usage patterns and suggest ways to reduce consumption. Reviews high-energy devices and their usage patterns.",
        arguments: [
            {
                name: "target_reduction",
                description: "Target energy reduction percentage (e.g., 10 for 10%)",
                required: false
            }
        ]
    },
    {
        name: "security_audit",
        description: "Review Home Assistant security settings, exposed entities, and suggest improvements. Checks for common security issues.",
    },
    {
        name: "backup_strategy",
        description: "Help design a comprehensive backup strategy for Home Assistant. Covers configuration, database, and automation backups.",
    }
];

export function getPrompt(name: string): Prompt | undefined {
    return prompts.find(p => p.name === name);
}

export function getAllPrompts(): Prompt[] {
    return prompts;
}
