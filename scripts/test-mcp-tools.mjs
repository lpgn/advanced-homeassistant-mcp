#!/usr/bin/env node

import { spawn } from "child_process";
import readline from "readline";

const DOCKER_ARGS = [
  "exec",
  "-i",
  "homeassistant-mcp-server",
  "node",
  "bin/stdio-server.js",
];

const REQUEST_TIMEOUT_MS = 15000;

const testCases = [
  { name: "system_info", arguments: {} },
  { name: "list_devices", arguments: {} },
  { name: "control", arguments: { command: "turn_on", entity_id: "light.test_entity" } },
  { name: "get_history", arguments: { entity_id: "light.test_entity" } },
  { name: "scene", arguments: { action: "list" } },
  { name: "notify", arguments: { message: "MCP server verification ping" } },
  { name: "automation", arguments: { action: "list" } },
  { name: "addon", arguments: { action: "list" } },
  { name: "package", arguments: { action: "list", category: "integration" } },
  {
    name: "automation_config",
    arguments: {
      action: "create",
      config: {
        alias: "Verification Automation",
        trigger: [],
        action: [],
      },
    },
  },
  { name: "subscribe_events", arguments: { token: process.env.HASS_TOKEN ?? "test-token" } },
  { name: "get_sse_stats", arguments: { token: process.env.HASS_TOKEN ?? "test-token" } },
  {
    name: "lights_control",
    arguments: { action: "list" },
  },
  {
    name: "climate_control",
    arguments: { action: "list" },
  },
  { name: "get_live_context", arguments: {} },
  { name: "entity_search", arguments: { query: "light" } },
  { name: "get_system_prompt", arguments: { include_areas: false } },
  { name: "dashboard_config", arguments: { operation: "list_card_types" } },
  { name: "domain_summary", arguments: { domain: "light" } },
  { name: "get_entity", arguments: { entity_id: "light.test_entity" } },
  { name: "system_overview", arguments: {} },
  { name: "restart_ha", arguments: { confirm: false } },
  { name: "yaml_editor", arguments: { operation: "list" } },
  { name: "call_service", arguments: { domain: "light", service: "turn_on" } },
  { name: "file_operations", arguments: { operation: "list", path: "." } },
  { name: "shell_command", arguments: { command: "echo verification" } },
  { name: "system_management", arguments: { action: "reload_script" } },
  { name: "error_log", arguments: { lines: 10 } },
];

const child = spawn("docker", DOCKER_ARGS, { stdio: ["pipe", "pipe", "pipe"] });

const pending = new Map();
let requestCounter = 0;
let readyResolve;
let readyReject;
const readiness = new Promise((resolve, reject) => {
  readyResolve = resolve;
  readyReject = reject;
});
let ready = false;

const stdoutInterface = readline.createInterface({ input: child.stdout });

stdoutInterface.on("line", (line) => {
  const trimmed = line.trim();
  if (!ready && trimmed.includes("FastMCP server started successfully")) {
    ready = true;
    readyResolve();
    return;
  }

  if (!trimmed.startsWith("{")) {
    process.stdout.write(`[server] ${trimmed}\n`);
    return;
  }

  try {
    const message = JSON.parse(trimmed);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      entry.resolve(message);
    } else {
      process.stdout.write(`[server] ${trimmed}\n`);
    }
  } catch (error) {
    process.stdout.write(`[parse-error] ${trimmed}\n`);
  }
});

child.stderr.on("data", (data) => {
  process.stdout.write(`[server:err] ${data}`);
});

child.on("error", (error) => {
  if (!ready) {
    readyReject?.(error);
  }
  process.stderr.write(`Failed to start stdio server: ${error.message}\n`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (!ready) {
    readyReject?.(new Error(`stdio server exited before readiness (code=${code}, signal=${signal})`));
  }
});

function sendRequest(method, params) {
  const id = `req-${++requestCounter}`;
  const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params });
  child.stdin.write(`${payload}\n`);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Request ${id} timed out after ${REQUEST_TIMEOUT_MS}ms`));
    }, REQUEST_TIMEOUT_MS);

    pending.set(id, {
      resolve: (message) => {
        clearTimeout(timer);
        resolve(message);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
  });
}

function parseToolResult(message) {
  if (message.error) {
    return { success: false, detail: message.error };
  }

  const result = message.result ?? {};
  if (result.isError) {
    return { success: false, detail: result };
  }

  if (!Array.isArray(result.content)) {
    return { success: true, detail: result };
  }

  const first = result.content[0];
  if (first?.type === "text") {
    try {
      const parsed = JSON.parse(first.text);
      return { success: Boolean(parsed.success ?? true), detail: parsed };
    } catch (error) {
      return { success: !result.isError, detail: first.text };
    }
  }

  return { success: !result.isError, detail: result };
}

function summarize(detail) {
  if (!detail) return "no details";
  if (typeof detail === "string") return detail;
  if (detail.message) return detail.message;
  if (detail.error) return detail.error;
  return JSON.stringify(detail);
}

async function run() {
  try {
    await readiness;

    const listResponse = await sendRequest("tools/list", {});
    const tools = listResponse.result?.tools?.map((tool) => tool.name) ?? [];
    process.stdout.write(`Discovered ${tools.length} tools via MCP server.\n`);

    const results = [];

    for (const test of testCases) {
      if (!tools.includes(test.name)) {
        results.push({
          name: test.name,
          success: false,
          detail: `Tool ${test.name} not registered`,
        });
        continue;
      }

      try {
        const response = await sendRequest("tools/call", {
          name: test.name,
          arguments: test.arguments,
        });
        const parsed = parseToolResult(response);
        results.push({ name: test.name, success: parsed.success, detail: summarize(parsed.detail) });
      } catch (error) {
        results.push({ name: test.name, success: false, detail: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    process.stdout.write(`\nTool invocation summary: ${successCount} succeeded, ${failureCount} failed.\n`);
    for (const result of results) {
      const status = result.success ? "PASS" : "FAIL";
      process.stdout.write(`${status} ${result.name}: ${result.detail}\n`);
    }
  } catch (error) {
    process.stderr.write(`Test execution failed: ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    child.stdin.end();
    child.kill("SIGTERM");
  }
}

await run();
