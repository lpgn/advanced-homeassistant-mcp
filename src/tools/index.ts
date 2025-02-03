import { Tool } from '../types/index';
import { listDevicesTool } from './list-devices.tool';
import { controlTool } from './control.tool';
import { historyTool } from './history.tool';
import { sceneTool } from './scene.tool';
import { notifyTool } from './notify.tool';
import { automationTool } from './automation.tool';
import { addonTool } from './addon.tool';
import { packageTool } from './package.tool';
import { automationConfigTool } from './automation-config.tool';
import { subscribeEventsTool } from './subscribe-events.tool';
import { getSSEStatsTool } from './sse-stats.tool';

// Tool category types
export enum ToolCategory {
    DEVICE = 'device',
    SYSTEM = 'system',
    AUTOMATION = 'automation'
}

// Tool priority levels
export enum ToolPriority {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low'
}

interface ToolMetadata {
    category: ToolCategory;
    platform: string;
    version: string;
    caching?: {
        enabled: boolean;
        ttl: number;
    };
}

// Array to track all tools
const tools: Tool[] = [
    listDevicesTool,
    controlTool,
    historyTool,
    sceneTool,
    notifyTool,
    automationTool,
    addonTool,
    packageTool,
    automationConfigTool,
    subscribeEventsTool,
    getSSEStatsTool
];

// Function to get a tool by name
export function getToolByName(name: string): Tool | undefined {
    return tools.find(tool => tool.name === name);
}

// Function to get all tools
export function getAllTools(): Tool[] {
    return [...tools];
}

// Export all tools individually
export {
    listDevicesTool,
    controlTool,
    historyTool,
    sceneTool,
    notifyTool,
    automationTool,
    addonTool,
    packageTool,
    automationConfigTool,
    subscribeEventsTool,
    getSSEStatsTool
}; 