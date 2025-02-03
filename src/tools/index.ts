import { Tool } from "../types/index.js";
import { listDevicesTool } from "./list-devices.tool.js";
import { controlTool } from "./control.tool.js";
import { historyTool } from "./history.tool.js";
import { sceneTool } from "./scene.tool.js";
import { notifyTool } from "./notify.tool.js";
import { automationTool } from "./automation.tool.js";
import { addonTool } from "./addon.tool.js";
import { packageTool } from "./package.tool.js";
import { automationConfigTool } from "./automation-config.tool.js";
import { subscribeEventsTool } from "./subscribe-events.tool.js";
import { getSSEStatsTool } from "./sse-stats.tool.js";

// Tool category types
export enum ToolCategory {
  DEVICE = "device",
  SYSTEM = "system",
  AUTOMATION = "automation",
}

// Tool priority levels
export enum ToolPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
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
export const tools: Tool[] = [
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
  getSSEStatsTool,
];

// Function to get a tool by name
export function getToolByName(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
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
  getSSEStatsTool,
};
