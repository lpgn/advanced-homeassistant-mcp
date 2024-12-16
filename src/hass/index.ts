import { CreateApplication, TServiceParams, StringConfig } from "@digital-alchemy/core";
import { LIB_HASS, PICK_ENTITY } from "@digital-alchemy/hass";
import { DomainSchema } from "../schemas.js";

type Environments = "development" | "production" | "test";

// Define the type for Home Assistant services
type HassServices = {
  [K in keyof typeof DomainSchema.Values]: {
    [service: string]: (data: Record<string, any>) => Promise<void>;
  };
};

// Define the type for Home Assistant instance
interface HassInstance extends TServiceParams {
  services: HassServices;
}

// application
const MY_APP = CreateApplication({
  configuration: {
    NODE_ENV: {
      type: "string",
      default: "development",
      enum: ["development", "production", "test"],
      description: "Code runner addon can set with it's own NODE_ENV",
    } satisfies StringConfig<Environments>,
    HASS_HOST: {
      type: "string",
      description: "Home Assistant host URL",
      required: true
    },
    HASS_TOKEN: {
      type: "string",
      description: "Home Assistant long-lived access token",
      required: true
    }
  },
  services: {},
  libraries: [LIB_HASS],
  name: 'hass' as const
});

let hassInstance: HassInstance;

export async function get_hass(): Promise<HassInstance> {
  if (!hassInstance) {
    const instance = await MY_APP.bootstrap();
    hassInstance = instance as unknown as HassInstance;
  }
  return hassInstance;
}