import { z } from "zod";
import {
  Tool,
  AutomationConfigParams,
  AutomationConfig,
  AutomationResponse,
} from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.ts";

export const automationConfigTool: Tool = {
  name: "automation_config",
  description: "Advanced automation configuration and management",
  parameters: z.object({
    action: z
      .enum(["create", "update", "delete", "duplicate"])
      .describe("Action to perform with automation config"),
    automation_id: z
      .string()
      .optional()
      .describe("Automation ID (required for update, delete, and duplicate)"),
    config: z
      .object({
        alias: z.string().describe("Friendly name for the automation"),
        description: z
          .string()
          .optional()
          .describe("Description of what the automation does"),
        mode: z
          .enum(["single", "parallel", "queued", "restart"])
          .optional()
          .describe("How multiple triggerings are handled"),
        trigger: z.array(z.record(z.string(), z.any())).describe("List of triggers"),
        condition: z.array(z.record(z.string(), z.any())).optional().describe("List of conditions"),
        action: z.array(z.record(z.string(), z.any())).describe("List of actions"),
      })
      .optional()
      .describe("Automation configuration (required for create and update)"),
  }),
  execute: async (params: AutomationConfigParams) => {
    try {
      switch (params.action) {
        case "create": {
          if (!params.config) {
            throw new Error(
              "Configuration is required for creating automation",
            );
          }

          const response = await fetch(
            `${APP_CONFIG.HASS_HOST}/api/config/automation/config`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(params.config),
            },
          );

          if (!response.ok) {
            throw new Error(
              `Failed to create automation: ${response.statusText}`,
            );
          }

          const responseData = (await response.json()) as {
            automation_id: string;
          };
          return {
            success: true,
            message: "Successfully created automation",
            automation_id: responseData.automation_id,
          };
        }

        case "update": {
          if (!params.automation_id || !params.config) {
            throw new Error(
              "Automation ID and configuration are required for updating automation",
            );
          }

          const response = await fetch(
            `${APP_CONFIG.HASS_HOST}/api/config/automation/config/${params.automation_id}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(params.config),
            },
          );

          if (!response.ok) {
            throw new Error(
              `Failed to update automation: ${response.statusText}`,
            );
          }

          const responseData = (await response.json()) as {
            automation_id: string;
          };
          return {
            success: true,
            automation_id: responseData.automation_id,
            message: "Automation updated successfully",
          };
        }

        case "delete": {
          if (!params.automation_id) {
            throw new Error(
              "Automation ID is required for deleting automation",
            );
          }

          const response = await fetch(
            `${APP_CONFIG.HASS_HOST}/api/config/automation/config/${params.automation_id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error(
              `Failed to delete automation: ${response.statusText}`,
            );
          }

          return {
            success: true,
            message: `Successfully deleted automation ${params.automation_id}`,
          };
        }

        case "duplicate": {
          if (!params.automation_id) {
            throw new Error(
              "Automation ID is required for duplicating automation",
            );
          }

          // First, get the existing automation config
          const getResponse = await fetch(
            `${APP_CONFIG.HASS_HOST}/api/config/automation/config/${params.automation_id}`,
            {
              headers: {
                Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!getResponse.ok) {
            throw new Error(
              `Failed to get automation config: ${getResponse.statusText}`,
            );
          }

          const config = (await getResponse.json()) as AutomationConfig;
          config.alias = `${config.alias} (Copy)`;

          // Create new automation with modified config
          const createResponse = await fetch(
            `${APP_CONFIG.HASS_HOST}/api/config/automation/config`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(config),
            },
          );

          if (!createResponse.ok) {
            throw new Error(
              `Failed to create duplicate automation: ${createResponse.statusText}`,
            );
          }

          const newAutomation =
            (await createResponse.json()) as AutomationResponse;
          return {
            success: true,
            message: `Successfully duplicated automation ${params.automation_id}`,
            new_automation_id: newAutomation.automation_id,
          };
        }
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
