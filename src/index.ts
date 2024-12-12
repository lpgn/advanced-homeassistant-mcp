import { get_hass } from "./hass/index.js";
import { Server,  } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import { TAreaId, TFloorId, TRawDomains, TRawEntityIds } from "@digital-alchemy/hass";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { formatToolCall } from "./helpers.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "homeassistant-mcp-server",
  version: "0.1.0",
}, {
  capabilities: {
    tools: {}
  }
});

const hass = await get_hass();

server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  return {
    tools: [
      {
        name: "list_domains",
        description: "Lists all domains in the home",
        inputSchema: zodToJsonSchema(z.object({})),
      },
      {
        name: "list_areas",
        description: "Lists all areas in the home",
        inputSchema: zodToJsonSchema(z.object({})),
      },
      {
        name: "list_floors",
        description: "Lists all floors in the home",
        inputSchema: zodToJsonSchema(z.object({})),
      },
      {
        name: "get_entity_state",
        description: "Gets the state of an entity",
        inputSchema: zodToJsonSchema(z.object({
          entity_id: z.string()
        })),
      },
      {
        name: "get_entities",
        description: "Gets entities, filtered by domain, floor, and area as needed",
        inputSchema: zodToJsonSchema(z.object({
          domain: z.string().optional(),
          floor: z.string().optional(),
          area: z.string().optional(),
        })),
      },
      {
        name: "get_entity_state_by_ids",
        description: "Gets a list of entities from a list of entity ids. Use this tool when there is more than one entity to get the state of.",
        inputSchema: zodToJsonSchema(z.object({
          entity_ids: z.array(z.string())
        })),
      }
    ]
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {

  switch (request.params.name) {
    case "list_domains":
      return formatToolCall(listDomains());
    case "list_areas":
      return formatToolCall(await listAreas());
    case "list_floors":
      return formatToolCall(await listFloors());
    case "get_entity_state":
      const entity_id = request.params.entity_id as TRawEntityIds;
      return formatToolCall(await getEntityState(entity_id));
    case "get_entities":
      const entities = await getEntities(request.params.arguments as { domain?: TRawDomains, floor?: TFloorId, area?: TAreaId });
      return formatToolCall(entities);
    case "get_entity_state_by_ids":
      const entity_ids = request.params?.arguments?.entity_ids as TRawEntityIds[];
      if (!entity_ids) {
        return formatToolCall({
          error: "No entity ids provided"
        }, true);
      }
      return formatToolCall(getEntityStateByIds(entity_ids));
    case "get_entity_history":
      return formatToolCall(getEntityHistory(request.params.arguments as { entity_id: TRawEntityIds, start_time: string, end_time?: string }));
    case "get_entity_history_by_ids":
      return formatToolCall(getEntityHistoryByIds(request.params.arguments as { entity_ids: TRawEntityIds[], start_time: string, end_time?: string }));
  }

  return formatToolCall({
    error: "Tool not found"
  }, true);
});


async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Home Assistant MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in runServer():", error);
  process.exit(1);
});

const listDomains = () => {
  return ["light", "climate", "alarm_control_panel", "cover", "switch", "sensor", "button"];
}

const getEntityHistoryByIds = (params: { entity_ids: TRawEntityIds[], start_time: string, end_time?: string }) => {
  return hass.hass.entity.history({
    entity_ids: params.entity_ids as TRawEntityIds[],
    end_time: params.end_time ? new Date(params.end_time) : new Date(),
    start_time: params.start_time
  });
}

const getEntityHistory = async (params: { entity_id: TRawEntityIds, start_time: string, end_time?: string }) => {
  return await hass.hass.entity.history({
    entity_ids: [params.entity_id as TRawEntityIds],
    end_time: params.end_time ? new Date(params.end_time) : new Date(),
    start_time: params.start_time
  });
}

const getEntityStateByIds = (entity_ids: TRawEntityIds[]) => {
  const entities = entity_ids.map(entity_id => hass.hass.entity.getCurrentState(entity_id as TRawEntityIds));
  return entities;
}

const getEntities = async (params: { domain?: TRawDomains, floor?: TFloorId, area?: TAreaId }) => {
  if (params.floor) {
    return hass.hass.idBy.floor(params.floor as TFloorId, params.domain as TRawDomains || undefined);
  }
  if (params.area) {
    return hass.hass.idBy.area(params.area as TAreaId, params.domain as TRawDomains || undefined);
  }
  if (params.domain) {
    return hass.hass.entity.listEntities(params.domain as TRawDomains);
  }
  return hass.hass.entity.listEntities();
}

const getEntityState = async (entity_id: TRawEntityIds) => {
  return await hass.hass.entity.getCurrentState(entity_id);
}

const listAreas = async () => {
  const areas = await hass.hass.area.list()
  return areas;
}

const listFloors = async () => {
  const floors = await hass.hass.floor.list()
  return floors;
}