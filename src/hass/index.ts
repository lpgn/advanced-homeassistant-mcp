import { CreateApplication, TServiceParams, ServiceFunction } from "@digital-alchemy/core";
import { LIB_HASS } from "@digital-alchemy/hass";
import { DomainSchema } from "../schemas.js";
import { HASS_CONFIG } from "../config/hass.config.js";

type Environments = "development" | "production" | "test";

// Define the type for Home Assistant services
type HassServiceMethod = (data: Record<string, unknown>) => Promise<void>;

type HassServices = {
  [K in keyof typeof DomainSchema.Values]: {
    [service: string]: HassServiceMethod;
  };
};

// Define the type for Home Assistant instance
interface HassInstance extends TServiceParams {
  services: HassServices;
}

// Configuration type for application with more specific constraints
type ApplicationConfiguration = {
  NODE_ENV: ServiceFunction<Environments>;
};

// Strict configuration type for Home Assistant
type HassConfiguration = {
  BASE_URL: {
    type: "string";
    description: string;
    required: true;
    default: string;
  };
  TOKEN: {
    type: "string";
    description: string;
    required: true;
    default: string;
  };
  SOCKET_URL: {
    type: "string";
    description: string;
    required: true;
    default: string;
  };
  SOCKET_TOKEN: {
    type: "string";
    description: string;
    required: true;
    default: string;
  };
};

// application
const MY_APP = CreateApplication<ApplicationConfiguration, {}>({
  configuration: {
    NODE_ENV: {
      type: "string",
      default: "development",
      enum: ["development", "production", "test"],
      description: "Code runner addon can set with it's own NODE_ENV",
    },
  },
  services: {
    NODE_ENV: () => {
      // Directly return the default value or use process.env
      return (process.env.NODE_ENV as Environments) || "development";
    }
  },
  libraries: [
    {
      ...LIB_HASS,
      configuration: {
        BASE_URL: {
          type: "string",
          description: "Home Assistant base URL",
          required: true,
          default: HASS_CONFIG.BASE_URL
        },
        TOKEN: {
          type: "string",
          description: "Home Assistant long-lived access token",
          required: true,
          default: HASS_CONFIG.TOKEN
        },
        SOCKET_URL: {
          type: "string",
          description: "Home Assistant WebSocket URL",
          required: true,
          default: HASS_CONFIG.SOCKET_URL
        },
        SOCKET_TOKEN: {
          type: "string",
          description: "Home Assistant WebSocket token",
          required: true,
          default: HASS_CONFIG.SOCKET_TOKEN
        }
      }
    }
  ],
  name: 'hass' as const
});

let hassInstance: HassInstance | null = null;

export async function get_hass(): Promise<HassInstance> {
  if (!hassInstance) {
    // Safely get configuration keys, providing an empty object as fallback
    const _sortedConfigKeys = Object.keys(MY_APP.configuration ?? {}).sort();

    const instance = await MY_APP.bootstrap();
    hassInstance = instance as HassInstance;
  }
  return hassInstance;
}