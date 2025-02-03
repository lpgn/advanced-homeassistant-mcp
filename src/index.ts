import "./polyfills.js";
import { config } from "dotenv";
import { resolve } from "path";
import express from "express";
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

// Load environment variables based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "test"
      ? ".env.test"
      : ".env.development";

console.log(`Loading environment from ${envFile}`);
config({ path: resolve(process.cwd(), envFile) });

// Configuration
const HASS_TOKEN = process.env.HASS_TOKEN;
const PORT = parseInt(process.env.PORT || "4000", 10);

console.log("Initializing Home Assistant connection...");

// Initialize Express app
const app = express();

// Apply security middleware
app.use(securityHeaders);
app.use(rateLimiter);
app.use(express.json());
app.use(validateRequest);
app.use(sanitizeInput);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
});

// Define Tool interface
interface Tool {
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

// Create API endpoints for each tool
tools.forEach((tool) => {
  app.post(`/api/tools/${tool.name}`, async (req, res) => {
    try {
      const result = await tool.execute(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  void server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
