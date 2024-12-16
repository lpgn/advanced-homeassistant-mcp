import { z } from 'zod';
import { DomainSchema } from '../schemas.js';

// Define types for tool and server
interface Tool {
    name: string;
    description: string;
    execute: (params: any) => Promise<any>;
    parameters: z.ZodType<any>;
}

// Mock LiteMCP class
class MockLiteMCP {
    private tools: Tool[] = [];

    constructor(public name: string, public version: string) { }

    addTool(tool: Tool) {
        this.tools.push(tool);
    }

    getTools() {
        return this.tools;
    }
}

// Mock the Home Assistant instance
jest.mock('../hass/index.js', () => ({
    get_hass: jest.fn().mockResolvedValue({
        services: {
            light: {
                turn_on: jest.fn().mockResolvedValue(undefined),
                turn_off: jest.fn().mockResolvedValue(undefined),
            },
            climate: {
                set_temperature: jest.fn().mockResolvedValue(undefined),
            },
        },
    }),
}));

describe('MCP Server Context and Tools', () => {
    let server: MockLiteMCP;

    beforeEach(async () => {
        server = new MockLiteMCP('home-assistant', '0.1.0');

        // Add the control tool to the server
        server.addTool({
            name: 'control',
            description: 'Control Home Assistant devices and services',
            execute: async (params: any) => {
                const domain = params.entity_id.split('.')[0];
                if (params.command === 'set_temperature' && domain !== 'climate') {
                    return {
                        success: false,
                        message: `Unsupported operation for domain: ${domain}`,
                    };
                }
                return {
                    success: true,
                    message: `Successfully executed ${params.command} for ${params.entity_id}`,
                };
            },
            parameters: z.object({
                command: z.string(),
                entity_id: z.string(),
                brightness: z.number().min(0).max(255).optional(),
                color_temp: z.number().optional(),
                rgb_color: z.tuple([z.number(), z.number(), z.number()]).optional(),
                temperature: z.number().optional(),
                hvac_mode: z.enum(['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only']).optional(),
                fan_mode: z.enum(['auto', 'low', 'medium', 'high']).optional(),
                position: z.number().min(0).max(100).optional(),
                tilt_position: z.number().min(0).max(100).optional(),
                area: z.string().optional(),
            }),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Custom Prompts', () => {
        it('should handle natural language commands for lights', async () => {
            const tools = server.getTools();
            const tool = tools.find(t => t.name === 'control');
            expect(tool).toBeDefined();

            // Test natural language command execution
            const result = await tool!.execute({
                command: 'turn_on',
                entity_id: 'light.living_room',
                brightness: 128,
            });

            expect(result).toEqual({
                success: true,
                message: expect.stringContaining('Successfully executed turn_on for light.living_room'),
            });
        });

        it('should handle natural language commands for climate control', async () => {
            const tools = server.getTools();
            const tool = tools.find(t => t.name === 'control');
            expect(tool).toBeDefined();

            // Test temperature control command
            const result = await tool!.execute({
                command: 'set_temperature',
                entity_id: 'climate.living_room',
                temperature: 22,
            });

            expect(result).toEqual({
                success: true,
                message: expect.stringContaining('Successfully executed set_temperature for climate.living_room'),
            });
        });
    });

    describe('High-Level Context', () => {
        it('should validate domain-specific commands', async () => {
            const tools = server.getTools();
            const tool = tools.find(t => t.name === 'control');
            expect(tool).toBeDefined();

            // Test invalid command for domain
            const result = await tool!.execute({
                command: 'set_temperature', // Climate command
                entity_id: 'light.living_room', // Light entity
                temperature: 22,
            });

            expect(result).toEqual({
                success: false,
                message: expect.stringContaining('Unsupported operation'),
            });
        });

        it('should handle area-based commands', async () => {
            const tools = server.getTools();
            const tool = tools.find(t => t.name === 'control');
            expect(tool).toBeDefined();

            // Test command with area context
            const result = await tool!.execute({
                command: 'turn_on',
                entity_id: 'light.living_room',
                area: 'Living Room',
            });

            expect(result).toEqual({
                success: true,
                message: expect.stringContaining('Successfully executed turn_on for light.living_room'),
            });
        });
    });

    describe('Tool Organization', () => {
        it('should have all required tools available', () => {
            const tools = server.getTools();
            const toolNames = tools.map(t => t.name);
            expect(toolNames).toContain('control');
        });

        it('should support all defined domains', () => {
            const tools = server.getTools();
            const tool = tools.find(t => t.name === 'control');
            expect(tool).toBeDefined();

            // Check if tool supports all domains from DomainSchema
            const supportedDomains = Object.values(DomainSchema.Values);
            const schema = tool!.parameters as z.ZodObject<any>;
            const shape = schema.shape;

            expect(shape).toBeDefined();
            expect(shape.entity_id).toBeDefined();
            expect(shape.command).toBeDefined();

            // Test each domain has its specific parameters
            supportedDomains.forEach(domain => {
                switch (domain) {
                    case 'light':
                        expect(shape.brightness).toBeDefined();
                        expect(shape.color_temp).toBeDefined();
                        expect(shape.rgb_color).toBeDefined();
                        break;
                    case 'climate':
                        expect(shape.temperature).toBeDefined();
                        expect(shape.hvac_mode).toBeDefined();
                        expect(shape.fan_mode).toBeDefined();
                        break;
                    case 'cover':
                        expect(shape.position).toBeDefined();
                        expect(shape.tilt_position).toBeDefined();
                        break;
                }
            });
        });
    });
}); 