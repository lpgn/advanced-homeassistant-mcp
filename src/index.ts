import { get_hass } from './hass/index.js';
import { Server as ModelContextProtocolServer } from 'litemcp';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

interface CommandParams {
  command: string;
  entity_id?: string;
}

async function main() {
  const hass = await get_hass();

  // Create MCP server
  const server = new ModelContextProtocolServer({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    models: [{
      name: 'home-assistant',
      description: 'Control Home Assistant devices and services',
      parameters: zodToJsonSchema(z.object({
        command: z.string().describe('The command to execute'),
        entity_id: z.string().optional().describe('The entity ID to control')
      })),
      handler: async (params: CommandParams) => {
        // Implement your command handling logic here
        // You can use the hass instance to interact with Home Assistant

        return {
          success: true,
          message: 'Command executed successfully'
        };
      }
    }]
  });

  // Start the server
  await server.start();
  console.log('MCP Server started on port', server.port);
}

main().catch(console.error);