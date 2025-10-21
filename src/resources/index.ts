/**
 * MCP Resource Endpoints
 * 
 * Provides URI-based access to Home Assistant entities and data
 * using the hass:// protocol scheme
 */

import { get_hass } from "../hass/index.js";
import { logger } from "../utils/logger.js";

export interface ResourceDescriptor {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}

export interface ResourceContent {
    uri: string;
    mimeType: string;
    text?: string;
    blob?: string;
}

/**
 * List all available resources
 */
export async function listResources(): Promise<ResourceDescriptor[]> {
    try {
        const hass = await get_hass();
        const states = await hass.getStates();

        const resources: ResourceDescriptor[] = [
            {
                uri: "hass://entities",
                name: "All Entities",
                description: "List all Home Assistant entities grouped by domain",
                mimeType: "application/json"
            },
            {
                uri: "hass://config",
                name: "Configuration",
                description: "Home Assistant configuration information",
                mimeType: "application/json"
            },
            {
                uri: "hass://services",
                name: "Services",
                description: "List all available Home Assistant services",
                mimeType: "application/json"
            }
        ];

        // Add individual entity resources
        for (const state of states) {
            resources.push({
                uri: `hass://entities/${state.entity_id}`,
                name: state.attributes?.friendly_name || state.entity_id,
                description: `Current state and attributes of ${state.entity_id}`,
                mimeType: "application/json"
            });
        }

        // Add domain-grouped resources
        const domains = new Set(states.map(s => s.entity_id.split('.')[0]));
        for (const domain of domains) {
            resources.push({
                uri: `hass://entities/domain/${domain}`,
                name: `${domain} entities`,
                description: `All entities in the ${domain} domain`,
                mimeType: "application/json"
            });
        }

        return resources;
    } catch (error) {
        logger.error(`Error listing resources: ${error}`);
        throw error;
    }
}

/**
 * Read a resource by URI
 */
export async function readResource(uri: string): Promise<ResourceContent> {
    try {
        const hass = await get_hass();

        // Parse the URI
        if (!uri.startsWith("hass://")) {
            throw new Error(`Invalid resource URI: ${uri}. Must start with hass://`);
        }

        const path = uri.substring(7); // Remove "hass://"

        // Handle different resource types
        if (path === "entities") {
            // List all entities grouped by domain
            const states = await hass.getStates();
            const grouped = states.reduce((acc: Record<string, any[]>, state) => {
                const domain = state.entity_id.split('.')[0];
                if (!acc[domain]) acc[domain] = [];
                acc[domain].push({
                    entity_id: state.entity_id,
                    name: state.attributes?.friendly_name || state.entity_id,
                    state: state.state
                });
                return acc;
            }, {});

            return {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(grouped, null, 2)
            };
        }

        if (path === "config") {
            // Get Home Assistant configuration
            const config = await hass.getConfig();
            return {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(config, null, 2)
            };
        }

        if (path === "services") {
            // Get all available services
            const services = await hass.getServices();
            return {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(services, null, 2)
            };
        }

        if (path.startsWith("entities/domain/")) {
            // Get entities for a specific domain
            const domain = path.substring(16);
            const states = await hass.getStates();
            const domainEntities = states
                .filter(s => s.entity_id.startsWith(domain + '.'))
                .map(s => ({
                    entity_id: s.entity_id,
                    name: s.attributes?.friendly_name || s.entity_id,
                    state: s.state,
                    attributes: s.attributes
                }));

            return {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                    domain,
                    count: domainEntities.length,
                    entities: domainEntities
                }, null, 2)
            };
        }

        if (path.startsWith("entities/")) {
            // Get specific entity
            const entityId = path.substring(9);
            const state = await hass.getState(entityId);
            
            if (!state) {
                throw new Error(`Entity ${entityId} not found`);
            }

            return {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                    entity_id: state.entity_id,
                    state: state.state,
                    attributes: state.attributes,
                    last_changed: state.last_changed,
                    last_updated: state.last_updated,
                    context: state.context
                }, null, 2)
            };
        }

        if (path.startsWith("search/")) {
            // Search entities
            const parts = path.substring(7).split('/');
            const query = decodeURIComponent(parts[0]);
            const limit = parts[1] ? parseInt(parts[1]) : 10;

            const states = await hass.getStates();
            const queryLower = query.toLowerCase();
            
            const results = states
                .filter(s => {
                    const entityLower = s.entity_id.toLowerCase();
                    const nameLower = (s.attributes?.friendly_name || '').toLowerCase();
                    return entityLower.includes(queryLower) || nameLower.includes(queryLower);
                })
                .slice(0, limit)
                .map(s => ({
                    entity_id: s.entity_id,
                    name: s.attributes?.friendly_name || s.entity_id,
                    state: s.state,
                    domain: s.entity_id.split('.')[0]
                }));

            return {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                    query,
                    limit,
                    found: results.length,
                    results
                }, null, 2)
            };
        }

        throw new Error(`Unknown resource path: ${path}`);

    } catch (error) {
        logger.error(`Error reading resource ${uri}: ${error}`);
        throw error;
    }
}

/**
 * Subscribe to resource updates (for future streaming support)
 */
export async function subscribeToResource(uri: string): Promise<void> {
    // TODO: Implement resource subscriptions for real-time updates
    logger.info(`Resource subscription requested for: ${uri}`);
    throw new Error("Resource subscriptions not yet implemented");
}
