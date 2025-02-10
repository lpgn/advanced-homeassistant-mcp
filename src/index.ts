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
const tools: Tool[] = [];

// Define the list devices tool
const listDevicesTool: Tool = {
  name: "list_devices",
  description: "List all available Home Assistant devices",
  parameters: z.object({}),
  execute: async () => {
    try {
      const devices = await list_devices();
      return {
        success: true,
        devices,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
};

// Add tools to the array
tools.push(listDevicesTool);

// Add the Home Assistant control tool
const controlTool: Tool = {
  name: "control",
  description: "Control Home Assistant devices and services",
  parameters: z.object({
    command: z.enum([
      ...commonCommands,
      ...coverCommands,
      ...climateCommands,
    ] as [string, ...string[]]),
    entity_id: z.string().describe("The ID of the entity to control"),
  }),
  execute: async (params: { command: Command; entity_id: string }) => {
    try {
      const [domain] = params.entity_id.split(".");
      await call_service(domain, params.command, {
        entity_id: params.entity_id,
      });
      return {
        success: true,
        message: `Command ${params.command} executed successfully on ${params.entity_id}`,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
};

// Add the control tool to the array
tools.push(controlTool);

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
app.get("/api/mcp", () => MCP_SCHEMA);
app.post("/api/mcp/execute", async ({ body }: { body: { tool: string; parameters: Record<string, unknown> } }) => {
  const { tool: toolName, parameters } = body;
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) {
    return {
      success: false,
      message: `Tool '${toolName}' not found`,
    };
  }
  return await tool.execute(parameters);
});

// Health check endpoint
app.get("/health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: "0.1.0",
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
