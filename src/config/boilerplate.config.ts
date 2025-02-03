export const BOILERPLATE_CONFIG = {
  configuration: {
    LOG_LEVEL: {
      type: "string" as const,
      default: "debug",
      description: "Logging level",
      enum: ["error", "warn", "info", "debug", "trace"],
    },
    CACHE_DIRECTORY: {
      type: "string" as const,
      default: ".cache",
      description: "Directory for cache files",
    },
    CONFIG_DIRECTORY: {
      type: "string" as const,
      default: ".config",
      description: "Directory for configuration files",
    },
    DATA_DIRECTORY: {
      type: "string" as const,
      default: ".data",
      description: "Directory for data files",
    },
  },
  internal: {
    boilerplate: {
      configuration: {
        LOG_LEVEL: "debug",
        CACHE_DIRECTORY: ".cache",
        CONFIG_DIRECTORY: ".config",
        DATA_DIRECTORY: ".data",
      },
    },
  },
};
