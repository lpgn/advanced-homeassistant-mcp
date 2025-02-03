import { z } from 'zod';
import { Tool, SceneParams, HassState } from '../types/index.js';
import { APP_CONFIG } from '../config/app.config.js';

export const sceneTool: Tool = {
    name: 'scene',
    description: 'Manage and activate Home Assistant scenes',
    parameters: z.object({
        action: z.enum(['list', 'activate']).describe('Action to perform with scenes'),
        scene_id: z.string().optional().describe('Scene ID to activate (required for activate action)'),
    }),
    execute: async (params: SceneParams) => {
        try {
            if (params.action === 'list') {
                const response = await fetch(`${APP_CONFIG.HASS_HOST}/api/states`, {
                    headers: {
                        Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch scenes: ${response.statusText}`);
                }

                const states = (await response.json()) as HassState[];
                const scenes = states.filter((state) => state.entity_id.startsWith('scene.'));

                return {
                    success: true,
                    scenes: scenes.map((scene) => ({
                        entity_id: scene.entity_id,
                        name: scene.attributes.friendly_name || scene.entity_id.split('.')[1],
                        description: scene.attributes.description,
                    })),
                };
            } else if (params.action === 'activate') {
                if (!params.scene_id) {
                    throw new Error('Scene ID is required for activate action');
                }

                const response = await fetch(`${APP_CONFIG.HASS_HOST}/api/services/scene/turn_on`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        entity_id: params.scene_id,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to activate scene: ${response.statusText}`);
                }

                return {
                    success: true,
                    message: `Successfully activated scene ${params.scene_id}`,
                };
            }

            throw new Error('Invalid action specified');
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    },
}; 