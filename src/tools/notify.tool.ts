import { z } from "zod";
import { Tool, NotifyParams } from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.ts";

export const notifyTool: Tool = {
  name: "notify",
  description: "Send notifications through Home Assistant",
  parameters: z.object({
    message: z.string().describe("The notification message"),
    title: z.string().optional().describe("The notification title"),
    target: z
      .string()
      .optional()
      .describe("Specific notification target (e.g., mobile_app_phone)"),
    data: z.record(z.any()).optional().describe("Additional notification data"),
  }),
  execute: async (params: NotifyParams) => {
    try {
      const service = params.target
        ? `notify.${params.target}`
        : "notify.notify";
      const [domain, service_name] = service.split(".");

      const response = await fetch(
        `${APP_CONFIG.HASS_HOST}/api/services/${domain}/${service_name}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: params.message,
            title: params.title,
            data: params.data,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      return {
        success: true,
        message: "Notification sent successfully",
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
