import { CreateApplication, TServiceParams, StringConfig } from "@digital-alchemy/core";

type Environments = "development" | "production" | "test";

import { LIB_HASS } from "@digital-alchemy/hass";

// application
const MY_APP = CreateApplication({
  configuration: {
    NODE_ENV: {
      type: "string",
      default: "development",
      enum: ["development", "production", "test"],
      description: "Code runner addon can set with it's own NODE_ENV",
    } satisfies StringConfig<Environments>,
  },
  services: {},
  libraries: [LIB_HASS],
  name: 'boilerplate'
});

const hass = await MY_APP.bootstrap()


export async function get_hass() {
  return hass;
}