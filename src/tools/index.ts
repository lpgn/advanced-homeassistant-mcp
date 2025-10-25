import { Tool } from "../types/index.js";
import { controlTool } from "./control.tool.js";
import { historyTool } from "./history.tool.js";
import { addonTool } from "./addon.tool.js";
import { packageTool } from "./package.tool.js";
import { automationConfigTool } from "./automation-config.tool.js";
import { subscribeEventsTool } from "./subscribe-events.tool.js";
import { getSSEStatsTool } from "./sse-stats.tool.js";
import { errorLogTool } from "./error-log.tool.js";
import { callServiceTool } from "./call-service.tool.js";
import { fileOperationsTool } from "./file-operations.tool.js";
import { shellCommandTool } from "./shell-command.tool.js";
import { systemManagementTool } from "./system-management.tool.js";
import { getLiveContextTool } from "./live-context.tool.js";
import { entitySearchTool } from "./entity-search.tool.js";
import { getSystemPromptTool } from "./prompts.tool.js";
import { dashboardConfigTool } from "./dashboard-config.tool.js";
import { domainSummaryTool } from "./domain-summary.tool.js";
import { getEntityTool } from "./entity-query.tool.js";
import { restartHaTool } from "./restart.tool.js";
import { systemOverviewTool } from "./system-overview.tool.js";
import { getVersionTool } from "./version.tool.js";
import { yamlEditorTool } from "./yaml-editor.tool.js";

// Import Tool objects (not classes) from homeassistant directory
import { lightsControlTool } from "./homeassistant/lights.tool.js";
import { climateControlTool } from "./homeassistant/climate.tool.js";
import { automationTool } from "./homeassistant/automation.tool.js";
import { listDevicesTool } from "./homeassistant/list-devices.tool.js";
import { notifyTool } from "./homeassistant/notify.tool.js";
import { sceneTool } from "./homeassistant/scene.tool.js";

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
  controlTool,
  historyTool,
  addonTool,
  packageTool,
  automationConfigTool,
  subscribeEventsTool,
  getSSEStatsTool,
  errorLogTool,
  callServiceTool,
  fileOperationsTool,
  shellCommandTool,
  systemManagementTool,
  // New advanced tools from official HA MCP integration
  getLiveContextTool,
  entitySearchTool,
  getSystemPromptTool,
  dashboardConfigTool,
  domainSummaryTool,
  getEntityTool,
  getVersionTool,
  systemOverviewTool,
  restartHaTool,
  yamlEditorTool,
  // Home Assistant tools
  lightsControlTool,
  climateControlTool,
  automationTool,
  listDevicesTool,
  notifyTool,
  sceneTool,
];

// Function to get a tool by name
export function getToolByName(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
}

// Export all tools individually
export {
  controlTool,
  historyTool,
  addonTool,
  packageTool,
  automationConfigTool,
  subscribeEventsTool,
  getSSEStatsTool,
  errorLogTool,
  callServiceTool,
  fileOperationsTool,
  shellCommandTool,
  systemManagementTool,
  // New advanced tools from official HA MCP integration
  getLiveContextTool,
  entitySearchTool,
  getSystemPromptTool,
  dashboardConfigTool,
  domainSummaryTool,
  getEntityTool,
  getVersionTool,
  systemOverviewTool,
  restartHaTool,
  yamlEditorTool,
  // Home Assistant tools
  lightsControlTool,
  climateControlTool,
  automationTool,
  listDevicesTool,
  notifyTool,
  sceneTool,
};
