import { z } from "zod";
import {
  Tool,
  AutomationParams,
  HassState,
  AutomationResponse,
} from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.js";

export const automationTool: Tool = {
  name: "automation",
  description: "Manage Home Assistant automations",
  parameters: z.object({
    action: z
      .enum(["list", "toggle", "trigger"])
      .describe("Action to perform with automation"),
    automation_id: z
      .string()
      .optional()
      .describe("Automation ID (required for toggle and trigger actions)"),
  }),
  execute: async (params: AutomationParams) => {
    try {
      if (params.action === "list") {
        const response = await fetch(`${APP_CONFIG.HASS_HOST}/api/states`, {
          headers: {
            Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch automations: ${response.statusText}`,
          );
        }

        const states = (await response.json()) as HassState[];
        const automations = states.filter((state) =>
          state.entity_id.startsWith("automation."),
        );

        return {
          success: true,
          automations: automations.map((automation) => ({
            entity_id: automation.entity_id,
            name:
              automation.attributes.friendly_name ||
              automation.entity_id.split(".")[1],
            state: automation.state,
            last_triggered: automation.attributes.last_triggered,
          })),
        };
      } else {
        if (!params.automation_id) {
          throw new Error(
            "Automation ID is required for toggle and trigger actions",
          );
        }

        const service = params.action === "toggle" ? "toggle" : "trigger";
        const response = await fetch(
          `${APP_CONFIG.HASS_HOST}/api/services/automation/${service}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              entity_id: params.automation_id,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to ${service} automation: ${response.statusText}`,
          );
        }

        const responseData = (await response.json()) as AutomationResponse;
        return {
          success: true,
          message: `Successfully ${service}d automation ${params.automation_id}`,
          automation_id: responseData.automation_id,
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
};
