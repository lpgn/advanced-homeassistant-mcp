import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "test"
      ? ".env.test"
      : ".env.development";

config({ path: resolve(process.cwd(), envFile) });

export const HASS_CONFIG = {
  // Base configuration
  BASE_URL: process.env.HASS_HOST || "http://localhost:8123",
  TOKEN: process.env.HASS_TOKEN || "",
  SOCKET_URL: process.env.HASS_WS_URL || "ws://localhost:8123/api/websocket",
  SOCKET_TOKEN: process.env.HASS_TOKEN || "",

  // Boilerplate configuration
  BOILERPLATE: {
    CACHE_DIRECTORY: ".cache",
    CONFIG_DIRECTORY: ".config",
    DATA_DIRECTORY: ".data",
    LOG_LEVEL: "debug",
    ENVIRONMENT: process.env.NODE_ENV || "development",
  },

  // Application configuration
  APP_NAME: "homeassistant-mcp",
  APP_VERSION: "1.0.0",

  // API configuration
  API_VERSION: "1.0.0",
  API_PREFIX: "/api",

  // Security configuration
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },

  // WebSocket configuration
  WS_CONFIG: {
    AUTO_RECONNECT: true,
    MAX_RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 1000,
  },
};
