import { z } from 'zod';
import { Tool, HassEntity } from '../interfaces/index.js';
import { get_hass } from '../hass/index.js';
import { DomainSchema } from '../schemas.js';

// Define tools array
export const tools: Tool[] = [
    {
        name: 'list_devices',
        description: 'List all devices connected to Home Assistant',
        parameters: z.object({
            domain: DomainSchema.optional(),
            area: z.string().optional(),
            floor: z.string().optional()
        }),
        execute: async (params) => {
            const hass = await get_hass();
            const states = await hass.states.get();

            // Filter by domain if specified
            let filteredStates = states;
            if (params.domain) {
                filteredStates = states.filter((state: HassEntity) => state.entity_id.startsWith(`${params.domain}.`));
            }

            // Filter by area if specified
            if (params.area) {
                filteredStates = filteredStates.filter((state: HassEntity) =>
                    state.attributes.area_id === params.area ||
                    state.attributes.area === params.area
                );
            }

            // Filter by floor if specified
            if (params.floor) {
                filteredStates = filteredStates.filter((state: HassEntity) =>
                    state.attributes.floor === params.floor
                );
            }

            return {
                success: true,
                devices: filteredStates.map((state: HassEntity) => ({
                    entity_id: state.entity_id,
                    state: state.state,
                    attributes: state.attributes
                }))
            };
        }
    },
    {
        name: 'control',
        description: 'Control a Home Assistant device',
        parameters: z.object({
            command: z.string(),
            entity_id: z.string(),
            state: z.string().optional(),
            brightness: z.number().min(0).max(255).optional(),
            color_temp: z.number().optional(),
            rgb_color: z.tuple([z.number(), z.number(), z.number()]).optional(),
            position: z.number().min(0).max(100).optional(),
            tilt_position: z.number().min(0).max(100).optional(),
            temperature: z.number().optional(),
            target_temp_high: z.number().optional(),
            target_temp_low: z.number().optional(),
            hvac_mode: z.string().optional(),
            fan_mode: z.string().optional(),
            humidity: z.number().min(0).max(100).optional()
        }),
        execute: async (params) => {
            const hass = await get_hass();
            const domain = params.entity_id.split('.')[0];

            const serviceData: Record<string, any> = {
                entity_id: params.entity_id
            };

            // Add optional parameters if they exist
            if (params.state) serviceData.state = params.state;
            if (params.brightness) serviceData.brightness = params.brightness;
            if (params.color_temp) serviceData.color_temp = params.color_temp;
            if (params.rgb_color) serviceData.rgb_color = params.rgb_color;
            if (params.position) serviceData.position = params.position;
            if (params.tilt_position) serviceData.tilt_position = params.tilt_position;
            if (params.temperature) serviceData.temperature = params.temperature;
            if (params.target_temp_high) serviceData.target_temp_high = params.target_temp_high;
            if (params.target_temp_low) serviceData.target_temp_low = params.target_temp_low;
            if (params.hvac_mode) serviceData.hvac_mode = params.hvac_mode;
            if (params.fan_mode) serviceData.fan_mode = params.fan_mode;
            if (params.humidity) serviceData.humidity = params.humidity;

            await hass.services.call(domain, params.command, serviceData);

            return {
                success: true,
                message: `Command '${params.command}' executed on ${params.entity_id}`
            };
        }
    }
]; 