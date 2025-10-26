import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Tool, SSEParams } from "../types/index.js";
import { sseManager } from "../sse/index.js";

export const subscribeEventsTool: Tool = {
  name: "subscribe_events",
  description:
    "Subscribe to Home Assistant events via Server-Sent Events (SSE)",
  parameters: z.object({
    token: z.string().describe("Authentication token (required)"),
    events: z
      .array(z.string())
      .optional()
      .describe("List of event types to subscribe to"),
    entity_id: z
      .string()
      .optional()
      .describe("Specific entity ID to monitor for state changes"),
    domain: z
      .string()
      .optional()
      .describe('Domain to monitor (e.g., "light", "switch", etc.)'),
  }),
  execute: async (params: SSEParams) => {
    if (process.env.USE_STDIO_TRANSPORT === "true") {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                message:
                  "SSE subscriptions are not available when running in stdio transport mode.",
                suggestion:
                  "Start the HTTP server or disable USE_STDIO_TRANSPORT to use subscribe_events.",
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    const clientId = uuidv4();

    // Set up SSE headers
    const responseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    // Create SSE client
    const client = {
      id: clientId,
      send: (data: string) => {
        return {
          headers: responseHeaders,
          body: `data: ${data}\n\n`,
          keepAlive: true,
        };
      },
    };

    // Add client to SSE manager with authentication
    const sseClient = sseManager.addClient(client, params.token);

    if (!sseClient || !sseClient.authenticated) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                message: sseClient
                  ? "Authentication failed"
                  : "Maximum client limit reached",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Subscribe to specific events if provided
    if (params.events?.length) {
      console.log(`Client ${clientId} subscribing to events:`, params.events);
      for (const eventType of params.events) {
        sseManager.subscribeToEvent(clientId, eventType);
      }
    }

    // Subscribe to specific entity if provided
    if (params.entity_id) {
      console.log(
        `Client ${clientId} subscribing to entity:`,
        params.entity_id,
      );
      sseManager.subscribeToEntity(clientId, params.entity_id);
    }

    // Subscribe to domain if provided
    if (params.domain) {
      console.log(`Client ${clientId} subscribing to domain:`, params.domain);
      sseManager.subscribeToDomain(clientId, params.domain);
    }

    return {
      headers: responseHeaders,
      body: `data: ${JSON.stringify({
        type: "connection",
        status: "connected",
        id: clientId,
        authenticated: true,
        subscriptions: {
          events: params.events || [],
          entities: params.entity_id ? [params.entity_id] : [],
          domains: params.domain ? [params.domain] : [],
        },
        timestamp: new Date().toISOString(),
      })}\n\n`,
      keepAlive: true,
    };
  },
};
