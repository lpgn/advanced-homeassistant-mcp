import { describe, test, expect, beforeEach, mock } from "bun:test";

const APP_CONFIG = {
  HASS_HOST: "http://localhost:8123",
  HASS_TOKEN: "test_token",
  VERSION: "1.0.0",
  SSE: {
    MAX_CLIENTS: 1000,
    PING_INTERVAL: 30000,
  },
};

mock.module("../../src/config/app.config.ts", () => ({
  APP_CONFIG,
}));

const baseStates = [
  {
    entity_id: "light.living_room",
    state: "on",
    attributes: {
      friendly_name: "Living Room Light",
      area_id: "living_room",
      brightness: 180,
      rgb_color: [255, 200, 100],
    },
    last_changed: "2025-10-26T19:00:00Z",
    last_updated: "2025-10-26T19:00:00Z",
  },
  {
    entity_id: "climate.hallway",
    state: "cool",
    attributes: {
      friendly_name: "Hallway Thermostat",
      temperature: 21,
      current_temperature: 23,
      hvac_mode: "cool",
    },
    last_changed: "2025-10-26T18:30:00Z",
    last_updated: "2025-10-26T18:35:00Z",
  },
  {
    entity_id: "automation.good_morning",
    state: "on",
    attributes: {
      friendly_name: "Good Morning",
      last_triggered: "2025-10-26T07:00:00Z",
    },
    last_changed: "2025-10-26T07:00:00Z",
    last_updated: "2025-10-26T07:00:10Z",
  },
  {
    entity_id: "sensor.outdoor_temp",
    state: "23",
    attributes: {
      friendly_name: "Outdoor Temperature",
      unit_of_measurement: "°C",
      device_class: "temperature",
    },
    last_changed: "2025-10-26T19:05:00Z",
    last_updated: "2025-10-26T19:05:00Z",
  },
  {
    entity_id: "switch.garden_pump",
    state: "off",
    attributes: {
      friendly_name: "Garden Pump",
    },
    last_changed: "2025-10-26T10:00:00Z",
    last_updated: "2025-10-26T10:00:00Z",
  },
];

const stateMap = new Map(baseStates.map((state) => [state.entity_id, state]));

const callServiceMock = mock(async (domain: string, service: string, data: Record<string, unknown>) => ({
  context: {
    id: `${domain}.${service}`,
  },
  data,
}));

const getStatesMock = mock(async () => baseStates);

const getStateMock = mock(async (entityId: string) => {
  const found = stateMap.get(entityId);
  if (!found) {
    throw new Error(`Entity ${entityId} not found`);
  }
  return found;
});

const getConfigMock = mock(async () => ({
  config_dir: "/config",
}));

const hassMock = {
  callService: callServiceMock,
  getStates: getStatesMock,
  getState: getStateMock,
  getConfig: getConfigMock,
};

const getHassMock = mock(async () => hassMock);

mock.module("../../src/hass/index.js", () => ({
  get_hass: getHassMock,
}));

const mockSseManager = {
  addClient: mock((client: any, token: string) =>
    token === APP_CONFIG.HASS_TOKEN
      ? { id: "client-123", authenticated: true, send: client.send }
      : { authenticated: false }
  ),
  subscribeToEvent: mock((clientId: string, eventType: string) => ({ clientId, eventType })),
  subscribeToEntity: mock((clientId: string, entityId: string) => ({ clientId, entityId })),
  subscribeToDomain: mock((clientId: string, domain: string) => ({ clientId, domain })),
  getStatistics: mock(async () => ({
    total_clients: 2,
    events_last_minute: 12,
    entities_watched: 5,
  })),
};

mock.module("../../src/sse/index.js", () => ({
  sseManager: mockSseManager,
}));

process.env.HASS_HOST = APP_CONFIG.HASS_HOST;
process.env.HASS_TOKEN = APP_CONFIG.HASS_TOKEN;
process.env.ENABLE_SHELL_COMMANDS = "true";
process.env.ENABLE_SYSTEM_RESTART = "true";
process.env.ENABLE_FILE_OPERATIONS = "true";
process.env.ENABLE_YAML_EDITOR = "true";
process.env.ALLOW_CONFIG_MODIFICATIONS = "true";

const fetchMock = mock(async () => new Response("{}", {
  status: 200,
  headers: { "Content-Type": "application/json" },
}));

globalThis.fetch = fetchMock as unknown as typeof fetch;

type JsonResult = {
  success: boolean;
  [key: string]: any;
};

const parseContent = (result: any): JsonResult => {
  expect(result.content).toBeDefined();
  expect(result.content[0]?.type).toBe("text");
  return JSON.parse(result.content[0].text);
};

const jsonResponse = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    statusText: init?.statusText,
    headers: { "Content-Type": "application/json" },
  });

const textResponse = (data: string, init?: ResponseInit) =>
  new Response(data, {
    status: init?.status ?? 200,
    statusText: init?.statusText,
    headers: { "Content-Type": "text/plain" },
  });

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({}))); 
  callServiceMock.mockReset();
  callServiceMock.mockImplementation(async (domain: string, service: string, data: Record<string, unknown>) => ({
    context: { id: `${domain}.${service}` },
    data,
  }));
  getStatesMock.mockReset();
  getStatesMock.mockImplementation(async () => baseStates);
  getStateMock.mockReset();
  getStateMock.mockImplementation(async (entityId: string) => {
    const found = stateMap.get(entityId);
    if (!found) {
      throw new Error(`Entity ${entityId} not found`);
    }
    return found;
  });
  getConfigMock.mockReset();
  getConfigMock.mockImplementation(async () => ({ config_dir: "/config" }));
  getHassMock.mockReset();
  getHassMock.mockImplementation(async () => hassMock);
  mockSseManager.addClient.mockReset();
  mockSseManager.addClient.mockImplementation((client: any, token: string) =>
    token === APP_CONFIG.HASS_TOKEN
      ? { id: "client-123", authenticated: true, send: client.send }
      : { authenticated: false }
  );
  mockSseManager.subscribeToEvent.mockReset();
  mockSseManager.subscribeToEntity.mockReset();
  mockSseManager.subscribeToDomain.mockReset();
  mockSseManager.getStatistics.mockReset();
  mockSseManager.getStatistics.mockImplementation(async () => ({
    total_clients: 2,
    events_last_minute: 12,
    entities_watched: 5,
  }));
});

const {
  controlTool,
} = await import("../../src/tools/control.tool.ts");
const { listDevicesTool } = await import("../../src/tools/homeassistant/list-devices.tool.ts");
const { automationTool } = await import("../../src/tools/homeassistant/automation.tool.ts");
const { automationConfigTool } = await import("../../src/tools/automation-config.tool.ts");
const { callServiceTool } = await import("../../src/tools/call-service.tool.ts");
const { shellCommandTool } = await import("../../src/tools/shell-command.tool.ts");
const { systemManagementTool } = await import("../../src/tools/system-management.tool.ts");
const { notifyTool } = await import("../../src/tools/homeassistant/notify.tool.ts");
const { getLiveContextTool } = await import("../../src/tools/live-context.tool.ts");
const { getEntityTool } = await import("../../src/tools/entity-query.tool.ts");
const { getSystemPromptTool } = await import("../../src/tools/prompts.tool.ts");
const { getSSEStatsTool } = await import("../../src/tools/sse-stats.tool.ts");
const { subscribeEventsTool } = await import("../../src/tools/subscribe-events.tool.ts");
const { yamlEditorTool } = await import("../../src/tools/yaml-editor.tool.ts");
const { fileOperationsTool } = await import("../../src/tools/file-operations.tool.ts");
const { addonTool } = await import("../../src/tools/addon.tool.ts");
const { packageTool } = await import("../../src/tools/package.tool.ts");
const { systemOverviewTool } = await import("../../src/tools/system-overview.tool.ts");
const { domainSummaryTool } = await import("../../src/tools/domain-summary.tool.ts");

describe("control tool", () => {
  test("turn_on light entity", async () => {
    fetchMock.mockImplementationOnce((url, init) => {
      expect(url).toBe(`${APP_CONFIG.HASS_HOST}/api/services/light/turn_on`);
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body).toEqual({
        entity_id: "light.living_room",
        brightness: 200,
      });
      return Promise.resolve(jsonResponse({}));
    });

    const result = await controlTool.execute({
      command: "turn_on",
      entity_id: "light.living_room",
      brightness: 200,
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.message).toBe("Successfully executed turn_on for light.living_room");
  });

  test("reject unsupported domain", async () => {
    const result = await controlTool.execute({
      command: "turn_on",
      entity_id: "media_player.living_room",
    });
    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Unsupported domain: media_player");
  });
});

describe("list devices tool", () => {
  test("groups devices by filters", async () => {
    const result = await listDevicesTool.execute({ domain: "light" });
    const payload = parseContent(result);
    expect(payload.devices).toHaveLength(1);
    expect(payload.devices[0].entity_id).toBe("light.living_room");
    expect(payload.filters_applied.domain).toBe("light");
  });
});

describe("automation tool", () => {
  test("lists automations", async () => {
    const result = await automationTool.execute({ action: "list" });
    const payload = parseContent(result);
    expect(payload.automations).toHaveLength(1);
    expect(payload.total_count).toBe(1);
    expect(payload.automations[0].entity_id).toBe("automation.good_morning");
  });

  test("toggles automation", async () => {
    const result = await automationTool.execute({
      action: "toggle",
      automation_id: "automation.good_morning",
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.message).toBe("Successfully toggled automation automation.good_morning");
    const call = callServiceMock.mock.calls[0];
    expect(call[0]).toBe("automation");
    expect(call[1]).toBe("toggle");
    expect(call[2]).toEqual({ entity_id: "automation.good_morning" });
  });
});

describe("automation config tool", () => {
  const sampleConfig = {
    alias: "Test Automation",
    trigger: [
      {
        platform: "state",
        entity_id: "sensor.outdoor_temp",
        to: "30",
      },
    ],
    action: [
      {
        service: "switch.turn_off",
        target: { entity_id: "switch.garden_pump" },
      },
    ],
  };

  test("creates automation", async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(jsonResponse({ automation_id: "automation.test_created" }))
    );

    const result = await automationConfigTool.execute({
      action: "create",
      config: sampleConfig,
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.automation_id).toBe("automation.test_created");
  });

  test("validates missing config", async () => {
    const result = await automationConfigTool.execute({ action: "create" });
    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.message).toContain("Configuration is required");
  });
});

describe("call_service tool", () => {
  test("invokes Home Assistant service", async () => {
    const result = await callServiceTool.execute({
      domain: "light",
      service: "turn_off",
      entity_id: "light.living_room",
      service_data: { transition: 2 },
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.service).toBe("light.turn_off");
    expect(payload.service_data.entity_id).toBe("light.living_room");
  });

  test("handles missing service", async () => {
    callServiceMock.mockImplementationOnce(() => {
      throw new Error("Service not found");
    });

    const result = await callServiceTool.execute({
      domain: "media_player",
      service: "volume_set",
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain("not found");
  });
});

describe("shell_command tool", () => {
  test("executes shell command via callService", async () => {
    const result = await shellCommandTool.execute({ command: "ls /config" });
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    const call = callServiceMock.mock.calls[0];
    expect(call[0]).toBe("shell_command");
    expect(call[2]).toEqual({ command: "ls /config" });
  });

  test("returns helpful message when service missing", async () => {
    callServiceMock.mockImplementationOnce(() => {
      throw new Error("service not found");
    });

    const result = await shellCommandTool.execute({ command: "whoami" });
    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain("Shell command service not available");
  });
});

describe("system_management tool", () => {
  test("reloads scripts", async () => {
    const result = await systemManagementTool.execute({
      action: "reload_script",
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.service).toBe("script.reload");
  });

  test("reports permission errors", async () => {
    callServiceMock.mockImplementationOnce(() => {
      throw new Error("permission denied");
    });

    const result = await systemManagementTool.execute({
      action: "restart",
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Permission denied");
  });
});

describe("notify tool", () => {
  test("sends message to default target", async () => {
    const result = await notifyTool.execute({ message: "Hello world" });
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.target).toBe("default");
    const call = callServiceMock.mock.calls[0];
    expect(call[0]).toBe("notify");
    expect(call[1]).toBe("notify");
  });
});

describe("get_live_context tool", () => {
  test("returns YAML summary", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse(baseStates)));

    const result = await getLiveContextTool.execute({});
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.summary).toContain("Retrieved");
    expect(payload.result).toContain("entities_by_domain");
  });

  test("handles missing matches", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse([])));

    const result = await getLiveContextTool.execute({ filter: "binary_sensor" });
    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("No entities found matching the filter");
  });
});

describe("get_entity tool", () => {
  test("returns minimal entity view", async () => {
    fetchMock.mockImplementationOnce((url) => {
      expect(url).toBe(`${APP_CONFIG.HASS_HOST}/api/states/light.living_room`);
      const entity = stateMap.get("light.living_room");
      if (!entity) {
        throw new Error("missing entity fixture");
      }
      return Promise.resolve(jsonResponse(entity));
    });

    const result = await getEntityTool.execute({ entity_id: "light.living_room" });
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.entity_id).toBe("light.living_room");
    expect(payload.state).toBe("on");
  });

  test("returns filtered fields", async () => {
    fetchMock.mockImplementationOnce((url) => {
      expect(url).toBe(`${APP_CONFIG.HASS_HOST}/api/states/light.living_room`);
      const entity = stateMap.get("light.living_room");
      if (!entity) {
        throw new Error("missing entity fixture");
      }
      return Promise.resolve(jsonResponse(entity));
    });

    const result = await getEntityTool.execute({
      entity_id: "light.living_room",
      fields: ["state", "attributes.friendly_name"],
    });

    expect(result.success).toBe(true);
    expect(result.state).toBe("on");
    expect(result.attributes.friendly_name).toBe("Living Room Light");
  });

  test("reports missing entity", async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(jsonResponse({}, { status: 404, statusText: "Not Found" }))
    );

    const notFound = getEntityTool.execute({ entity_id: "light.unknown" });
    await expect(notFound).resolves.toEqual({
      success: false,
      message: "Entity light.unknown not found",
    });
  });
});

describe("system prompts and overview", () => {
  test("get_system_prompt respects domain filter", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse(baseStates)));

    const result = await getSystemPromptTool.execute({
      domain_filter: ["light"],
      include_areas: false,
    });
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.metadata.includes_entities).toBe(true);
    expect(payload.prompt).toContain("light.living_room");
    expect(payload.prompt).not.toContain("sensor.outdoor_temp");
  });

  test("system_overview aggregates data", async () => {
    fetchMock.mockImplementation((url: any) => {
      if (typeof url === "string" && url.endsWith("/api/states")) {
        return Promise.resolve(jsonResponse(baseStates));
      }
      if (typeof url === "string" && url.endsWith("/api/config")) {
        return Promise.resolve(jsonResponse({
          version: "2025.10.0",
          location_name: "Test Home",
          time_zone: "UTC",
          unit_system: { temperature: "°C" },
          components: ["light", "sensor"],
        }));
      }
      if (typeof url === "string" && url.endsWith("/api/services")) {
        return Promise.resolve(jsonResponse({
          light: { turn_on: {}, turn_off: {} },
          homeassistant: { restart: {} },
        }));
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const result = await systemOverviewTool.execute({});
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.entities.total_count).toBe(baseStates.length);
    expect(payload.system.version).toBe("2025.10.0");
  });
});

describe("sse tools", () => {
  test("get_sse_stats authenticates token", async () => {
    const result = await getSSEStatsTool.execute({ token: APP_CONFIG.HASS_TOKEN });
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.statistics.total_clients).toBe(2);
  });

  test("rejects invalid token", async () => {
    const result = await getSSEStatsTool.execute({ token: "wrong" });
    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Authentication failed");
  });

  test("subscribe_events establishes stream", async () => {
    const result = await subscribeEventsTool.execute({
      token: APP_CONFIG.HASS_TOKEN,
      events: ["state_changed"],
      entity_id: "light.living_room",
    });

    expect(result.keepAlive).toBe(true);
    const dataLine = result.body.trim().split("\n")[0];
    const payload = JSON.parse(dataLine.replace("data: ", ""));
    expect(payload.authenticated).toBe(true);
    expect(payload.subscriptions.events).toContain("state_changed");
    expect(mockSseManager.subscribeToEvent.mock.calls[0][1]).toBe("state_changed");
  });

  test("subscribe_events handles auth failure", async () => {
    mockSseManager.addClient.mockImplementationOnce(() => null);

    const result = await subscribeEventsTool.execute({
      token: APP_CONFIG.HASS_TOKEN,
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Maximum client limit reached");
  });
});

describe("yaml editor tool", () => {
  test("lists available yaml files", async () => {
    const result = await yamlEditorTool.execute({ operation: "list" });
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.files)).toBe(true);
    expect(payload.files.some((file: any) => file.path === "automations.yaml")).toBe(true);
  });

  test("reads yaml file", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(textResponse("name: Sample Automation")));

    const result = await yamlEditorTool.execute({
      operation: "read",
      file_path: "automations.yaml",
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.file_path).toBe("automations.yaml");
    expect(payload.content).toEqual({ name: "Sample Automation" });
  });
});

describe("file operations tool", () => {
  test("returns security warning", async () => {
    const result = await fileOperationsTool.execute({
      operation: "write",
      path: "configuration.yaml",
      content: "foo: bar",
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("File operations not supported");
  });
});

describe("addon tool", () => {
  test("lists addons", async () => {
    const addonResponse = {
      data: {
        addons: [
          {
            name: "File Editor",
            slug: "a0d7b954_file-editor",
            description: "Edit configuration files",
            version: "5.0",
            installed: true,
            available: "5.0",
            state: "started",
          },
        ],
      },
    };
    fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse(addonResponse)));

    const result = await addonTool.execute({ action: "list" });
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.addons[0].slug).toBe("a0d7b954_file-editor");
  });

  test("requires slug for info", async () => {
    const result = await addonTool.execute({ action: "info" });
    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Add-on slug is required for this action");
  });
});

describe("package tool", () => {
  test("lists hacs repositories", async () => {
    const response = {
      repositories: [
        {
          name: "Awesome Integration",
          description: "Adds awesome features",
          installed: false,
        },
      ],
    };
    fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse(response)));

    const result = await packageTool.execute({
      action: "list",
      category: "integration",
    });

    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.packages[0].name).toBe("Awesome Integration");
  });

  test("requires repository when installing", async () => {
    const result = await packageTool.execute({
      action: "install",
      category: "integration",
    });
    const payload = parseContent(result);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Repository is required for this action");
  });
});

describe("domain summary tool", () => {
  test("summarizes domain", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse(baseStates)));
    const result = await domainSummaryTool.execute({ domain: "light" });
    const payload = parseContent(result);
    expect(payload.success).toBe(true);
    expect(payload.total_count).toBe(1);
    expect(payload.state_distribution.on).toBe(1);
  });
});
