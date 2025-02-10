import { file } from "bun";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import {
  rateLimiter,
  securityHeaders,
  validateRequest,
  sanitizeInput,
  errorHandler,
} from "./security/index.js";
import {
  get_hass,
  call_service,
  list_devices,
  get_states,
  get_state,
} from "./hass/index.js";
import { z } from "zod";
import {
  commonCommands,
  coverCommands,
  climateCommands,
  type Command,
} from "./commands.js";
import { speechService } from "./speech/index.js";
import { APP_CONFIG } from "./config/app.config.js";
import { loadEnvironmentVariables } from "./config/loadEnv.js";
import { MCP_SCHEMA } from "./mcp/schema.js";
import {
  listDevicesTool,
  controlTool,
  subscribeEventsTool,
  getSSEStatsTool,
  automationConfigTool,
  addonTool,
  packageTool,
  sceneTool,
  notifyTool,
  historyTool,
} from "./tools/index.js";

// Load environment variables based on NODE_ENV
await loadEnvironmentVariables();

// Configuration
const HASS_TOKEN = process.env.HASS_TOKEN;
const PORT = parseInt(process.env.PORT || "4000", 10);

console.log("Initializing Home Assistant connection...");

// Define Tool interface and export it
export interface Tool {
  name: string;
  description: string;
  parameters: z.ZodType<any>;
  execute: (params: any) => Promise<any>;
}

// Array to store tools
const tools: Tool[] = [
  listDevicesTool,
  controlTool,
  subscribeEventsTool,
  getSSEStatsTool,
  automationConfigTool,
  addonTool,
  packageTool,
  sceneTool,
  notifyTool,
  historyTool,
];

// Initialize Elysia app with middleware
const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(rateLimiter)
  .use(securityHeaders)
  .use(validateRequest)
  .use(sanitizeInput)
  .use(errorHandler);

// Mount API routes
app.get("/api/mcp/schema", () => MCP_SCHEMA);

app.post("/api/mcp/execute", async ({ body }: { body: { name: string; parameters: Record<string, unknown> } }) => {
  const { name: toolName, parameters } = body;
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    return {
      success: false,
      message: `Tool '${toolName}' not found`,
    };
  }

  try {
    const result = await tool.execute(parameters);
    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
});

// Health check endpoint with MCP info
app.get("/api/mcp/health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: "1.0.0",
  mcp_version: "1.0",
  supported_tools: tools.map(t => t.name),
  speech_enabled: APP_CONFIG.SPEECH.ENABLED,
  wake_word_enabled: APP_CONFIG.SPEECH.WAKE_WORD_ENABLED,
  speech_to_text_enabled: APP_CONFIG.SPEECH.SPEECH_TO_TEXT_ENABLED,
}));

// Initialize speech service if enabled
if (APP_CONFIG.SPEECH.ENABLED) {
  console.log("Initializing speech service...");
  speechService.initialize().catch((error) => {
    console.error("Failed to initialize speech service:", error);
  });
}

// Create API endpoints for each tool
tools.forEach((tool) => {
  app.post(`/api/tools/${tool.name}`, async ({ body }: { body: Record<string, unknown> }) => {
    const result = await tool.execute(body);
    return result;
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  if (APP_CONFIG.SPEECH.ENABLED) {
    await speechService.shutdown().catch((error) => {
      console.error("Error shutting down speech service:", error);
    });
  }
  process.exit(0);
});

// Export tools for testing purposes
export { tools };
