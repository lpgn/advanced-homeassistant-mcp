import { z } from 'zod';
import { DomainSchema } from '../schemas.js';

export const MCP_SCHEMA = {
    tools: [
        {
            name: "list_devices",
            description: "List all devices connected to Home Assistant",
            parameters: {
                type: "object",
                properties: {
                    domain: {
                        type: "string",
                        enum: [
                            "light",
                            "climate",
                            "alarm_control_panel",
                            "cover",
                            "switch",
                            "contact",
                            "media_player",
                            "fan",
                            "lock",
                            "vacuum",
                            "scene",
                            "script",
                            "camera"
                        ]
                    },
                    area: { type: "string" },
                    floor: { type: "string" }
                },
                required: []
            }
        },
        {
            name: "control",
            description: "Control Home Assistant entities (lights, climate, etc.)",
            parameters: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        enum: [
                            "turn_on",
                            "turn_off",
                            "toggle",
                            "open",
                            "close",
                            "stop",
                            "set_position",
                            "set_tilt_position",
                            "set_temperature",
                            "set_hvac_mode",
                            "set_fan_mode",
                            "set_humidity"
                        ]
                    },
                    entity_id: { type: "string" },
                    state: { type: "string" },
                    brightness: { type: "number" },
                    color_temp: { type: "number" },
                    rgb_color: {
                        type: "array",
                        items: { type: "number" },
                        minItems: 3,
                        maxItems: 3
                    },
                    position: { type: "number" },
                    tilt_position: { type: "number" },
                    temperature: { type: "number" },
                    target_temp_high: { type: "number" },
                    target_temp_low: { type: "number" },
                    hvac_mode: { type: "string" },
                    fan_mode: { type: "string" },
                    humidity: { type: "number" }
                },
                required: ["command", "entity_id"]
            }
        },
        {
            name: "subscribe_events",
            description: "Subscribe to Home Assistant events via SSE",
            parameters: {
                type: "object",
                properties: {
                    events: {
                        type: "array",
                        items: { type: "string" }
                    },
                    entity_id: { type: "string" },
                    domain: { type: "string" }
                },
                required: []
            }
        },
        {
            name: "get_sse_stats",
            description: "Get statistics about SSE connections",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    ],
    prompts: [],
    resources: [
        {
            name: "Home Assistant API",
            url: "https://developers.home-assistant.io/docs/api/rest/"
        },
        {
            name: "Home Assistant WebSocket API",
            url: "https://developers.home-assistant.io/docs/api/websocket"
        }
    ]
}; 