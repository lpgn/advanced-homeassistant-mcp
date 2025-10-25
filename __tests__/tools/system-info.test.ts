import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import {
    type MockLiteMCPInstance,
    type Tool,
    TEST_CONFIG,
    createMockLiteMCPInstance,
    setupTestEnvironment,
    cleanupMocks,
    createMockResponse,
    getMockCallArgs
} from "../utils/test-utils";

describe("System Insight Tools", () => {
    let liteMcpInstance: MockLiteMCPInstance;
    let addToolCalls: Tool[];
    let mocks: ReturnType<typeof setupTestEnvironment>;

    const getTool = (name: string) => addToolCalls.find(tool => tool.name === name);

    const entityState = {
        entity_id: "light.living_room",
        state: "on",
        attributes: {
            friendly_name: "Living Room Light",
            brightness: 200,
            color_temp: 350
        },
        last_changed: "2025-10-24T18:00:00Z",
        last_updated: "2025-10-24T18:05:00Z"
    };

    beforeEach(async () => {
        mocks = setupTestEnvironment();
        liteMcpInstance = createMockLiteMCPInstance();
        await import("../../src/index.js");
        addToolCalls = liteMcpInstance.addTool.mock.calls.map(call => call.args[0]);
    });

    afterEach(() => {
        cleanupMocks({ liteMcpInstance, ...mocks });
    });

    test("get_version returns system details", async () => {
        mocks.mockFetch = mock((input: any) => {
            const url = typeof input === "string" ? input : input.url;
            expect(url).toBe(`${TEST_CONFIG.HASS_HOST}/api/config`);
            return Promise.resolve(createMockResponse({
                version: "2025.10.0",
                unit_system: { temperature: "°C" },
                time_zone: "Europe/Paris",
                location_name: "Home",
                latitude: 10,
                longitude: 20,
                elevation: 5,
                config_dir: "/config",
                whitelist_external_dirs: [],
                allowlist_external_dirs: [],
                components: ["light", "switch"]
            }));
        });
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("get_version");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("get_version tool not found");

        const result = await tool.execute({}) as any;
        expect(result.success).toBe(true);
        expect(result.version).toBe("2025.10.0");
        expect(result.unit_system.temperature).toBe("°C");

        type FetchArgs = [url: string, init: RequestInit];
        const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
        expect(args).toBeDefined();
        if (!args) throw new Error("No fetch calls recorded");
        const [url, options] = args;
        expect(url).toBe(`${TEST_CONFIG.HASS_HOST}/api/config`);
        expect(options).toEqual({
            headers: {
                Authorization: `Bearer ${TEST_CONFIG.HASS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    });

    test("get_version handles API errors", async () => {
        mocks.mockFetch = mock(() => Promise.resolve(new Response("", { status: 500, statusText: "Server Error" })));
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("get_version");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("get_version tool not found");

        const result = await tool.execute({}) as any;
        expect(result.success).toBe(false);
        expect(result.message).toBe("Failed to get system config: Server Error");
    });

    test("get_entity returns minimal state by default", async () => {
        mocks.mockFetch = mock(() => Promise.resolve(createMockResponse(entityState)));
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("get_entity");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("get_entity tool not found");

        const result = await tool.execute({ entity_id: "light.living_room" }) as any;
        expect(result.success).toBe(true);
        expect(result.state).toBe("on");
        expect(result.friendly_name).toBe("Living Room Light");

        type FetchArgs = [url: string, init: RequestInit];
        const args = getMockCallArgs<FetchArgs>(mocks.mockFetch);
        expect(args).toBeDefined();
        if (!args) throw new Error("No fetch calls recorded");
        const [url] = args;
        expect(url).toBe(`${TEST_CONFIG.HASS_HOST}/api/states/light.living_room`);
    });

    test("get_entity supports field filtering", async () => {
        mocks.mockFetch = mock(() => Promise.resolve(createMockResponse(entityState)));
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("get_entity");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("get_entity tool not found");

        const result = await tool.execute({
            entity_id: "light.living_room",
            fields: ["state", "attributes.friendly_name"]
        }) as any;

        expect(result.success).toBe(true);
        expect(result.state).toBe("on");
        expect(result.attributes).toEqual({ friendly_name: "Living Room Light" });
    });

    test("get_entity handles missing entities", async () => {
        mocks.mockFetch = mock(() => Promise.resolve(new Response("", { status: 404, statusText: "Not Found" })));
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("get_entity");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("get_entity tool not found");

        const result = await tool.execute({ entity_id: "light.unknown" }) as any;
        expect(result.success).toBe(false);
        expect(result.message).toBe("Entity light.unknown not found");
    });

    test("domain_summary groups entities by state", async () => {
        const mockStates = [
            entityState,
            { ...entityState, entity_id: "light.kitchen", state: "off", attributes: { friendly_name: "Kitchen Light" } },
            { ...entityState, entity_id: "switch.coffee_maker", state: "on", attributes: { friendly_name: "Coffee Maker" } }
        ];

        mocks.mockFetch = mock(() => Promise.resolve(createMockResponse(mockStates)));
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("domain_summary");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("domain_summary tool not found");

        const result = await tool.execute({ domain: "light", example_limit: 2 }) as any;
        expect(result.success).toBe(true);
        expect(result.total_count).toBe(2);
        expect(result.state_distribution).toEqual({ on: 1, off: 1 });
        expect(result.examples).toHaveLength(2);
        expect(result.examples[0].entity_id.startsWith("light.")).toBe(true);
    });

    test("domain_summary handles empty domain", async () => {
        const mockStates = [
            { ...entityState, entity_id: "sensor.temperature", state: "22" }
        ];

        mocks.mockFetch = mock(() => Promise.resolve(createMockResponse(mockStates)));
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("domain_summary");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("domain_summary tool not found");

        const result = await tool.execute({ domain: "light" }) as any;
        expect(result.success).toBe(true);
        expect(result.total_count).toBe(0);
        expect(result.message).toBe('No entities found in domain "light"');
    });

    test("system_overview aggregates system data", async () => {
        const statesResponse = [entityState, { ...entityState, entity_id: "sensor.outdoor_temp", state: "15" }];
        const configResponse = {
            version: "2025.10.0",
            location_name: "Home",
            time_zone: "Europe/Paris",
            unit_system: { temperature: "°C" },
            components: ["light", "sensor"]
        };
        const servicesResponse = {
            light: { turn_on: {}, turn_off: {} },
            sensor: { calibrate: {} },
            homeassistant: { restart: {} }
        };

        mocks.mockFetch = mock((input: any) => {
            const url = typeof input === "string" ? input : input.url;
            if (url.endsWith("/api/states")) {
                return Promise.resolve(createMockResponse(statesResponse));
            }
            if (url.endsWith("/api/config")) {
                return Promise.resolve(createMockResponse(configResponse));
            }
            if (url.endsWith("/api/services")) {
                return Promise.resolve(createMockResponse(servicesResponse));
            }
            throw new Error(`Unexpected fetch URL: ${url}`);
        });
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("system_overview");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("system_overview tool not found");

        const result = await tool.execute({}) as any;
        expect(result.success).toBe(true);
        expect(result.entities.total_count).toBe(2);
        expect(result.system.version).toBe("2025.10.0");
        expect(result.services.total_domains).toBe(3);
        const topDomains = result.top_domains.map((domain: any) => domain.domain);
        expect(topDomains).toContain("light");
    });

    test("system_overview surfaces fetch failures", async () => {
        mocks.mockFetch = mock((input: any) => {
            const url = typeof input === "string" ? input : input.url;
            if (url.endsWith("/api/states")) {
                return Promise.resolve(createMockResponse([entityState]));
            }
            if (url.endsWith("/api/config")) {
                return Promise.resolve(new Response("", { status: 500, statusText: "Server Error" }));
            }
            return Promise.resolve(createMockResponse({ homeassistant: { restart: {} } }));
        });
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("system_overview");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("system_overview tool not found");

        const result = await tool.execute({}) as any;
        expect(result.success).toBe(false);
        expect(result.message).toBe("Failed to fetch system data");
    });

    test("restart_ha requires confirmation", async () => {
        const tool = getTool("restart_ha");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("restart_ha tool not found");

        const result = await tool.execute({ confirm: false }) as any;
        expect(result.success).toBe(false);
        expect(result.message).toBe("Restart requires confirmation. Set confirm=true to proceed with restarting Home Assistant.");
        expect(mocks.mockFetch.mock.calls.length).toBe(0);
    });

    test("restart_ha posts restart command", async () => {
        mocks.mockFetch = mock((input: any, init?: RequestInit) => {
            const url = typeof input === "string" ? input : input.url;
            expect(url).toBe(`${TEST_CONFIG.HASS_HOST}/api/services/homeassistant/restart`);
            expect(init?.method).toBe("POST");
            expect(init?.body).toBe("{}");
            return Promise.resolve(createMockResponse({}));
        });
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("restart_ha");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("restart_ha tool not found");

        const result = await tool.execute({ confirm: true }) as any;
        expect(result.success).toBe(true);
        expect(result.message).toContain("Home Assistant is restarting");
    });

    test("restart_ha reports API failure", async () => {
        mocks.mockFetch = mock(() => Promise.resolve(new Response("", { status: 500, statusText: "Server Error" })));
        globalThis.fetch = mocks.mockFetch;

        const tool = getTool("restart_ha");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("restart_ha tool not found");

        const result = await tool.execute({ confirm: true }) as any;
        expect(result.success).toBe(false);
        expect(result.message).toBe("Failed to restart Home Assistant: Server Error");
    });

    test("dashboard_config lists card types", async () => {
        const tool = getTool("dashboard_config");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("dashboard_config tool not found");

        const result = await tool.execute({ operation: "list_card_types" }) as any;
        expect(result.success).toBe(true);
        expect(Array.isArray(result.card_types)).toBe(true);
        expect(result.card_types.length).toBeGreaterThan(5);
    });

    test("dashboard_config creates view config", async () => {
        const tool = getTool("dashboard_config");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("dashboard_config tool not found");

        const result = await tool.execute({
            operation: "create_view",
            config: { title: "Living Room", path: "living", icon: "mdi:sofa" }
        }) as any;

        expect(result.success).toBe(true);
        expect(result.view_config.title).toBe("Living Room");
        expect(result.yaml_config).toContain("title: Living Room");
    });

    test("yaml_editor lists available configuration files", async () => {
        const tool = getTool("yaml_editor");
        expect(tool).toBeDefined();
        if (!tool) throw new Error("yaml_editor tool not found");

        const result = await tool.execute({ operation: "list" }) as any;
        expect(result.success).toBe(true);
        expect(Array.isArray(result.files)).toBe(true);
        expect(result.files.some((file: any) => file.path === "automations.yaml")).toBe(true);
    });
});
