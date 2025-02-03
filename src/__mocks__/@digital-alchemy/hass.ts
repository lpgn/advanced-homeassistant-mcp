import { mock } from "bun:test";

export const LIB_HASS = {
  configuration: {
    name: "Home Assistant",
    version: "2024.2.0",
    location_name: "Home",
    time_zone: "UTC",
    components: ["automation", "script", "light", "switch"],
    unit_system: {
      temperature: "°C",
      length: "m",
      mass: "kg",
      pressure: "hPa",
      volume: "L",
    },
  },
  services: {
    light: {
      turn_on: mock(() => Promise.resolve()),
      turn_off: mock(() => Promise.resolve()),
      toggle: mock(() => Promise.resolve()),
    },
    switch: {
      turn_on: mock(() => Promise.resolve()),
      turn_off: mock(() => Promise.resolve()),
      toggle: mock(() => Promise.resolve()),
    },
    automation: {
      trigger: mock(() => Promise.resolve()),
      turn_on: mock(() => Promise.resolve()),
      turn_off: mock(() => Promise.resolve()),
    },
    script: {
      turn_on: mock(() => Promise.resolve()),
      turn_off: mock(() => Promise.resolve()),
      toggle: mock(() => Promise.resolve()),
    },
  },
  states: {
    light: {
      "light.living_room": {
        state: "on",
        attributes: {
          brightness: 255,
          color_temp: 300,
          friendly_name: "Living Room Light",
        },
      },
      "light.bedroom": {
        state: "off",
        attributes: {
          friendly_name: "Bedroom Light",
        },
      },
    },
    switch: {
      "switch.tv": {
        state: "off",
        attributes: {
          friendly_name: "TV",
        },
      },
    },
  },
  events: {
    subscribe: mock(() => Promise.resolve()),
    unsubscribe: mock(() => Promise.resolve()),
    fire: mock(() => Promise.resolve()),
  },
  connection: {
    subscribeEvents: mock(() => Promise.resolve()),
    subscribeMessage: mock(() => Promise.resolve()),
    sendMessage: mock(() => Promise.resolve()),
    close: mock(() => Promise.resolve()),
  },
};
