import { get_hass } from "./hass/index.js";
import { LiteMCP } from "litemcp";
import { z } from "zod";
import { TAreaId, TFloorId, TRawDomains, TRawEntityIds } from "@digital-alchemy/hass";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ListRequestSchema, AreaSchema, FloorSchema } from "./schemas.js";

const server = new LiteMCP(
  "example-server",
  "1.0.0",
);

const hass = await get_hass();

server.addTool({
  name: "list_domains",
  description: "Lists all domains in the home",
  parameters: z.object({}),
  execute: async () => {
    return ["light", "climate", "alarm_control_panel", "cover", "switch", "sensor", "button"];
  }
});

server.addTool({
  name: "list_areas",
  description: "Lists all areas in the home",
  parameters: z.object({}),
  execute: async () => {
    return await areasRequestHandler();
  }
});

server.addTool({
  name: "list_floors",
  description: "Lists all floors in the home",
  parameters: z.object({}),
  execute: async () => {
    return await floorsRequestHandler();
  }
});

server.addTool({
  name: "get_entity_state",
  description: "Gets the state of an entity",
  parameters: z.object({
    entity_id: z.string()
  }),
  execute: async (request) => {
    return await hass.hass.entity.getCurrentState(request.entity_id as TRawEntityIds);
  }
});

server.addTool({
  name: "get_entities",
  description: "Gets entities, filtered by domain, floor, and area as needed",
  parameters: z.object({
    domain: z.string().optional(),
    floor: z.string().optional(),
    area: z.string().optional(),
  }),
  execute: async (request) => {
    if (request.floor) {
      return hass.hass.idBy.floor(request.floor as TFloorId, request.domain as TRawDomains || undefined);
    }
    if (request.area) {
      return hass.hass.idBy.area(request.area as TAreaId, request.domain as TRawDomains || undefined);
    }
    if (request.domain) {
      return hass.hass.entity.listEntities(request.domain as TRawDomains);
    }
    return hass.hass.entity.listEntities();
  }
});

server.addTool({
  name: "get_entity_state_by_ids",
  description: "Gets a list of entities from a list of entity ids. Use this tool when there is more than one entity to get the state of.",
  parameters: z.object({
    entity_ids: z.array(z.string())
  }),
  execute: async (request) => {
    const entities = request.entity_ids.map(entity_id => hass.hass.entity.getCurrentState(entity_id as TRawEntityIds));
    return entities;
  }
})

server.addTool({
  name: "get_entity_history",
  description: "Gets the history of an entity",
  parameters: z.object({
    entity_id: z.string(),
    start_time: z.string(),
    end_time: z.string().optional()
  }),
  execute: async (request) => {
    return await hass.hass.entity.history({
      end_time: request.end_time ? new Date(request.end_time) : new Date(),
      entity_ids: [request.entity_id as TRawEntityIds],
      start_time: request.start_time
    });
  }
})

server.addTool({
  name: "get_entity_history_by_ids",
  description: "Gets the history of a list of entities",
  parameters: z.object({
    entity_ids: z.array(z.string()),
    start_time: z.string(),
    end_time: z.string().optional()
  }),
  execute: async (request) => {
    return await hass.hass.entity.history({
      entity_ids: request.entity_ids as TRawEntityIds[],
      end_time: request.end_time ? new Date(request.end_time) : new Date(),
      start_time: request.start_time
    });
  }
})
  
const areasRequestHandler = async () => {
  const areas = await hass.hass.area.list()
  return areas;
}

const floorsRequestHandler = async () => {
  const floors = await hass.hass.floor.list()
  return floors;
}

server.start();
