import { z } from "zod";
import { Tool } from "../types/index.js";
import { APP_CONFIG } from "../config/app.config.js";

/**
 * Entity Search Tool
 * 
 * Searches for Home Assistant entities using natural language queries.
 * Performs fuzzy matching on entity IDs and friendly names to find relevant entities.
 * 
 * Examples:
 * - "kitchen light" → finds light.kitchen, light.kitchen_ceiling, etc.
 * - "bedroom temperature" → finds sensor.bedroom_temperature
 * - "living room" → finds all entities in the living room area
 */
export const entitySearchTool: Tool = {
  name: "search_entities",
  description: 
    "Search for Home Assistant entities using natural language descriptions. " +
    "Supports fuzzy matching on entity names, friendly names, and areas. " +
    "Use this to find entity IDs when you have a natural language description like 'kitchen light' or 'bedroom temperature sensor'. " +
    "Returns a list of matching entities with their IDs, names, states, and domains.",
  parameters: z.object({
    query: z.string().describe("Natural language search query (e.g., 'kitchen light', 'bedroom temperature', 'living room lights')"),
    domain: z.string().optional().describe("Optional: limit search to specific domain (e.g., 'light', 'sensor', 'switch')"),
    limit: z.number().min(1).max(50).optional().default(10).describe("Maximum number of results to return (default: 10)"),
  }),
  execute: async (params: { query: string; domain?: string; limit?: number }) => {
    try {
      const limit = params.limit || 10;
      
      // Fetch all states from Home Assistant
      const response = await fetch(
        `${APP_CONFIG.HASS_HOST}/api/states`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${APP_CONFIG.HASS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Failed to retrieve states from Home Assistant: ${response.statusText}`
            }, null, 2)
          }]
        };
      }

      const allStates = await response.json();

      // Filter by domain if specified
      let states = allStates;
      if (params.domain) {
        const domainLower = params.domain.toLowerCase();
        states = allStates.filter((entity: any) => 
          entity.entity_id.toLowerCase().startsWith(domainLower + ".")
        );
      }

      // Normalize query for fuzzy matching
      const queryLower = params.query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);

      // Score each entity based on matching
      const scoredEntities = states.map((entity: any) => {
        const entityIdLower = entity.entity_id.toLowerCase();
        const friendlyName = (entity.attributes.friendly_name || "").toLowerCase();
        const areaId = (entity.attributes.area_id || "").toLowerCase();
        
        let score = 0;

        // Exact match on entity_id or friendly_name gets highest score
        if (entityIdLower === queryLower || friendlyName === queryLower) {
          score += 100;
        }

        // Check if all query words appear in entity_id or friendly_name
        const matchesAllWords = queryWords.every(word => 
          entityIdLower.includes(word) || friendlyName.includes(word) || areaId.includes(word)
        );

        if (matchesAllWords) {
          score += 50;
        }

        // Score for each individual word match
        for (const word of queryWords) {
          if (entityIdLower.includes(word)) {
            score += 10;
          }
          if (friendlyName.includes(word)) {
            score += 15; // Friendly name matches are slightly more valuable
          }
          if (areaId.includes(word)) {
            score += 5;
          }

          // Bonus for word at start of entity_id or friendly_name
          if (entityIdLower.startsWith(word) || friendlyName.startsWith(word)) {
            score += 5;
          }
        }

        // Bonus for shorter entity names (more specific matches)
        if (score > 0) {
          score += Math.max(0, 10 - entityIdLower.length / 10);
        }

        return {
          entity,
          score
        };
      }).filter(item => item.score > 0);

      // Sort by score (highest first) and limit results
      scoredEntities.sort((a, b) => b.score - a.score);
      const topMatches = scoredEntities.slice(0, limit);

      if (topMatches.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `No entities found matching query: "${params.query}"${params.domain ? ` in domain: ${params.domain}` : ""}`,
              suggestion: "Try a different search term or remove the domain filter"
            }, null, 2)
          }]
        };
      }

      // Format results
      const results = topMatches.map(item => ({
        entity_id: item.entity.entity_id,
        name: item.entity.attributes.friendly_name || item.entity.entity_id,
        state: item.entity.state,
        domain: item.entity.entity_id.split(".")[0],
        area: item.entity.attributes.area_id || null,
        match_score: Math.round(item.score),
        // Include key attributes
        attributes: {
          device_class: item.entity.attributes.device_class,
          unit_of_measurement: item.entity.attributes.unit_of_measurement,
        }
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            query: params.query,
            total_matches: topMatches.length,
            results: results,
            tip: "Use the entity_id from these results to control devices with the control tool"
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
          }, null, 2)
        }]
      };
    }
  },
};
