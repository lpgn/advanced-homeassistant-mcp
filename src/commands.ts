// Common commands that work with most entities
export const commonCommands = ["turn_on", "turn_off", "toggle"] as const;

// Commands specific to cover entities
export const coverCommands = [
  ...commonCommands,
  "open",
  "close",
  "stop",
  "set_position",
  "set_tilt_position",
] as const;

// Commands specific to climate entities
export const climateCommands = [
  ...commonCommands,
  "set_temperature",
  "set_hvac_mode",
  "set_fan_mode",
  "set_humidity",
] as const;

// Types for command validation
export type CommonCommand = (typeof commonCommands)[number];
export type CoverCommand = (typeof coverCommands)[number];
export type ClimateCommand = (typeof climateCommands)[number];
export type Command = CommonCommand | CoverCommand | ClimateCommand;
