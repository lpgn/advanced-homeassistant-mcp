import { CreateApplication } from "@digital-alchemy/core";
import { LIB_HASS } from "@digital-alchemy/hass";

// Create the application following the documentation example
const app = CreateApplication({
  libraries: [LIB_HASS],
  name: "home_automation",
  configuration: {
    hass: {
      BASE_URL: {
        type: "string" as const,
        default: process.env.HASS_HOST || "http://localhost:8123",
        description: "Home Assistant URL",
      },
      TOKEN: {
        type: "string" as const,
        default: process.env.HASS_TOKEN || "",
        description: "Home Assistant long-lived access token",
      },
    },
  },
});

let instance: Awaited<ReturnType<typeof app.bootstrap>>;

export async function get_hass() {
  if (!instance) {
    try {
      instance = await app.bootstrap();
    } catch (error) {
      console.error("Failed to initialize Home Assistant:", error);
      throw error;
    }
  }
  return instance;
}

// Helper function to call Home Assistant services
export async function call_service(
  domain: string,
  service: string,
  data: Record<string, any>,
) {
  const hass = await get_hass();
  return hass.hass.internals.callService(domain, service, data);
}

// Helper function to list devices
export async function list_devices() {
  const hass = await get_hass();
  return hass.hass.device.list();
}

// Helper function to get entity states
export async function get_states() {
  const hass = await get_hass();
  return hass.hass.internals.getStates();
}

// Helper function to get a specific entity state
export async function get_state(entity_id: string) {
  const hass = await get_hass();
  return hass.hass.internals.getState(entity_id);
}
