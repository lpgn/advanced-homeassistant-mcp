/**
 * History Tool for Home Assistant
 * 
 * Retrieves historical state data for entities
 */

import { z } from "zod";
import { logger } from "../utils/logger.js";
import { BaseTool } from "./base-tool.js";
import { MCPContext } from "../mcp/types.js";
import { get_hass } from "../hass/index.js";
import { Tool } from "../types/index.js";

const historySchema = z.object({
    entity_id: z.string().describe("Entity ID to get history for (e.g., 'light.living_room')"),
    start_time: z.string().optional().describe("Start time in ISO format (default: 24 hours ago)"),
    end_time: z.string().optional().describe("End time in ISO format (default: now)"),
    minimal_response: z.boolean().optional().default(false).describe("Return minimal data (state and timestamp only)"),
    significant_changes_only: z.boolean().optional().default(false).describe("Only return significant state changes"),
});

type HistoryParams = z.infer<typeof historySchema>;

/**
 * HistoryTool class extending BaseTool
 */
export class HistoryTool extends BaseTool {
    constructor() {
        super({
            name: "get_history",
            description: "Get historical state data for an entity. Useful for analyzing patterns, debugging automations, or understanding device behavior over time.",
            parameters: historySchema,
            metadata: {
                category: "analytics",
                version: "1.0.0",
                tags: ["history", "analytics", "patterns", "troubleshooting"],
            }
        });
    }

    public async execute(params: HistoryParams, _context: MCPContext): Promise<Record<string, unknown>> {
        logger.debug(`Executing HistoryTool with params: ${JSON.stringify(params)}`);
        
        const validatedParams = this.validateParams(params);
        return await executeHistoryLogic(validatedParams);
    }
}

// Shared execution logic
async function executeHistoryLogic(params: HistoryParams): Promise<Record<string, unknown>> {
    try {
        const hass = await get_hass();

        // Get current entity state to verify it exists
        const currentState = await hass.getState(params.entity_id);
        if (!currentState) {
            return {
                success: false,
                error: `Entity '${params.entity_id}' not found`,
                message: "Please check the entity_id is correct"
            };
        }

        // Calculate time range (default to last 24 hours)
        const endTime = params.end_time ? new Date(params.end_time) : new Date();
        const startTime = params.start_time 
            ? new Date(params.start_time)
            : new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

        // Get history from Home Assistant
        const history = await hass.getHistory(params.entity_id, startTime, endTime);

        if (!history || history.length === 0) {
            return {
                success: true,
                entity_id: params.entity_id,
                current_state: currentState.state,
                history_count: 0,
                message: "No history data found for the specified time range",
                time_range: {
                    start: startTime.toISOString(),
                    end: endTime.toISOString()
                }
            };
        }

        // Process history data
        let processedHistory = history;

        // Filter for significant changes only if requested
        if (params.significant_changes_only && processedHistory.length > 0) {
            processedHistory = processedHistory.filter((entry: any, index: number) => {
                if (index === 0) return true; // Always include first entry
                const prevEntry = processedHistory[index - 1];
                return entry.state !== prevEntry.state;
            });
        }

        // Format based on minimal_response flag
        const formattedHistory = params.minimal_response
            ? processedHistory.map((entry: any) => ({
                state: entry.state,
                last_changed: entry.last_changed
              }))
            : processedHistory.map((entry: any) => ({
                state: entry.state,
                last_changed: entry.last_changed,
                last_updated: entry.last_updated,
                attributes: entry.attributes || {}
              }));

        // Calculate statistics
        const states = processedHistory.map((e: any) => e.state);
        const stateChanges = new Set(states).size;
        const uniqueStates = Array.from(new Set(states));

        // Calculate time in each state (for simple states)
        const stateTimings: Record<string, number> = {};
        for (let i = 0; i < processedHistory.length - 1; i++) {
            const currentEntry = processedHistory[i];
            const nextEntry = processedHistory[i + 1];
            const state = currentEntry.state;
            const duration = new Date(nextEntry.last_changed).getTime() - new Date(currentEntry.last_changed).getTime();
            stateTimings[state] = (stateTimings[state] || 0) + duration;
        }

        // Convert durations to human-readable format
        const formatDuration = (ms: number) => {
            const hours = Math.floor(ms / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        };

        const stateTimingsFormatted = Object.entries(stateTimings).reduce((acc, [state, ms]) => {
            acc[state] = formatDuration(ms);
            return acc;
        }, {} as Record<string, string>);

        return {
            success: true,
            entity_id: params.entity_id,
            current_state: currentState.state,
            friendly_name: currentState.attributes?.friendly_name || params.entity_id,
            time_range: {
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                duration_hours: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))
            },
            statistics: {
                total_entries: history.length,
                returned_entries: formattedHistory.length,
                state_changes: stateChanges,
                unique_states: uniqueStates,
                time_in_each_state: stateTimingsFormatted
            },
            history: formattedHistory
        };

    } catch (error) {
        logger.error(`Error retrieving history: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

// Tool object export for FastMCP/stdio transport
export const historyTool: Tool = {
    name: "get_history",
    description: "Get historical state data for an entity. Useful for analyzing patterns, debugging automations, or understanding device behavior over time.",
    parameters: historySchema,
    execute: executeHistoryLogic
};
