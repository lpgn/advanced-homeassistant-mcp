import { z } from "zod";
import { Tool, PackageParams, HacsResponse } from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.ts";

export const packageTool: Tool = {
  name: "package",
  description: "Manage HACS packages and custom components",
  parameters: z.object({
    action: z
      .enum(["list", "install", "uninstall", "update"])
      .describe("Action to perform with package"),
    category: z
      .enum([
        "integration",
        "plugin",
        "theme",
        "python_script",
        "appdaemon",
        "netdaemon",
      ])
      .describe("Package category"),
    repository: z
      .string()
      .optional()
      .describe("Repository URL or name (required for install)"),
    version: z.string().optional().describe("Version to install"),
  }),
  execute: async (params: PackageParams) => {
    try {
      const hacsBase = `${APP_CONFIG.HASS_HOST}/api/hacs`;

      if (params.action === "list") {
        const response = await fetch(
          `${hacsBase}/repositories?category=${params.category}`,
          {
            headers: {
              Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch packages: ${response.statusText}`);
        }

        const data = (await response.json()) as HacsResponse;
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              packages: data.repositories
            }, null, 2)
          }]
        };
      } else {
        if (!params.repository) {
          throw new Error("Repository is required for this action");
        }

        let endpoint = "";
        const body: Record<string, any> = {
          category: params.category,
          repository: params.repository,
        };

        switch (params.action) {
          case "install":
            endpoint = "/repository/install";
            if (params.version) {
              body.version = params.version;
            }
            break;
          case "uninstall":
            endpoint = "/repository/uninstall";
            break;
          case "update":
            endpoint = "/repository/update";
            break;
        }

        const response = await fetch(`${hacsBase}${endpoint}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to ${params.action} package: ${response.statusText}`,
          );
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Successfully ${params.action}ed package ${params.repository}`
            }, null, 2)
          }]
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred"
          }, null, 2)
        }]
      };
    }
  },
};
