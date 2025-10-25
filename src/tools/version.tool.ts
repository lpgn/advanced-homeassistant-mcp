import { z } from 'zod';

/**
 * Get Home Assistant version and system information
 * Provides version, unit system, timezone, and location details
 */
export const getVersionTool = {
  name: 'get_version',
  description: 'Get the Home Assistant version and system information including unit system, timezone, and location',
  parameters: z.object({}),
  execute: async () => {
    try {
      const HASS_HOST = process.env.HASS_HOST;
      const HASS_TOKEN = process.env.HASS_TOKEN;

      if (!HASS_HOST || !HASS_TOKEN) {
        throw new Error('HASS_HOST or HASS_TOKEN not configured');
      }

      const response = await fetch(`${HASS_HOST}/api/config`, {
        headers: {
          Authorization: `Bearer ${HASS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get system config: ${response.statusText}`);
      }

      const config = await response.json();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            version: config.version,
            unit_system: config.unit_system,
            time_zone: config.time_zone,
            location_name: config.location_name,
            latitude: config.latitude,
            longitude: config.longitude,
            elevation: config.elevation,
            config_dir: config.config_dir,
            whitelist_external_dirs: config.whitelist_external_dirs,
            allowlist_external_dirs: config.allowlist_external_dirs,
            components: config.components?.length || 0,
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
