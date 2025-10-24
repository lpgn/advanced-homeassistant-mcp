import { z } from "zod";
import { Tool } from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.ts";
import { sseManager } from "../sse/index.js";

export const getSSEStatsTool: Tool = {
  name: "get_sse_stats",
  description: "Get SSE connection statistics",
  parameters: z.object({
    token: z.string().describe("Authentication token (required)"),
  }),
  execute: async (params: { token: string }) => {
    try {
      if (params.token !== APP_CONFIG.HASS_TOKEN) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: false,
                  message: "Authentication failed",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const stats = await sseManager.getStatistics();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                statistics: stats,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                message:
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  },
};
