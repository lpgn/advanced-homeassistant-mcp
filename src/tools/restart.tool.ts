import { z } from 'zod';

/**
 * Restart Home Assistant with safety confirmation
 * Requires explicit confirmation to prevent accidental restarts
 */
export const restartHaTool = {
  name: 'restart_ha',
  description: 'Restart Home Assistant. REQUIRES CONFIRMATION: Set confirm=true to execute. This will restart the entire Home Assistant instance, causing temporary unavailability of all services.',
  parameters: z.object({
    confirm: z.boolean().describe('Must be set to true to confirm the restart. This is a safety measure to prevent accidental restarts.'),
  }),
  execute: async (params: { confirm: boolean }) => {
    try {
      if (!params.confirm) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              message: 'Restart requires confirmation. Set confirm=true to proceed with restarting Home Assistant.',
              warning: 'Restarting Home Assistant will cause temporary unavailability of all smart home services.',
            }, null, 2)
          }]
        };
      }

      const HASS_HOST = process.env.HASS_HOST;
      const HASS_TOKEN = process.env.HASS_TOKEN;

      if (!HASS_HOST || !HASS_TOKEN) {
        throw new Error('HASS_HOST or HASS_TOKEN not configured');
      }

      const response = await fetch(`${HASS_HOST}/api/services/homeassistant/restart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HASS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Failed to restart Home Assistant: ${response.statusText}`);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: 'Home Assistant is restarting... This will take approximately 1-2 minutes.',
            note: 'All services will be temporarily unavailable during the restart.',
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
          }, null, 2)
        }]
      };
    }
  },
};
