import { CreateApplication, TServiceParams, StringConfig } from "@digital-alchemy/core";
import { LIB_HASS, PICK_ENTITY } from "@digital-alchemy/hass";

type Environments = "development" | "production" | "test";

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

let hassInstance: Awaited<ReturnType<typeof MY_APP.bootstrap>>;

export async function get_hass() {
  if (!hassInstance) {
    hassInstance = await MY_APP.bootstrap();
  }
  return hassInstance;
}