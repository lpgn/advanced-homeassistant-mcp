import { z } from "zod";

/**
 * Interface for a tool that can be executed by the MCP
 * @interface Tool
 */
export interface Tool {
  /** Unique name identifier for the tool */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Zod schema for validating tool parameters */
  parameters: z.ZodType<any>;
  /** Function to execute the tool with the given parameters */
  execute: (params: any) => Promise<any>;
}

/**
 * Parameters for controlling Home Assistant devices
 * @interface CommandParams
 */
export interface CommandParams {
  /** Command to execute (e.g., turn_on, turn_off) */
  command: string;
  /** Entity ID to control */
  entity_id?: string;
  /** Area ID to control all devices of the domain type */
  area_id?: string;
  /** Common parameters */
  state?: string;
  /** Light parameters */
  brightness?: number;
  color_temp?: number;
  rgb_color?: [number, number, number];
  /** Cover parameters */
  position?: number;
  tilt_position?: number;
  /** Climate parameters */
  temperature?: number;
  target_temp_high?: number;
  target_temp_low?: number;
  hvac_mode?: string;
  fan_mode?: string;
  humidity?: number;
}

/**
 * Home Assistant entity interface
 * @interface HassEntity
 */
export interface HassEntity {
  /** Entity ID in format domain.name */
  entity_id: string;
  /** Current state of the entity */
  state: string;
  /** Entity attributes */
  attributes: Record<string, any>;
  /** Last state change timestamp */
  last_changed?: string;
  /** Last update timestamp */
  last_updated?: string;
  /** Context information */
  context?: {
    id: string;
    parent_id?: string;
    user_id?: string;
  };
}

/**
 * Home Assistant state interface
 * @interface HassState
 */
export interface HassState {
  /** Entity ID in format domain.name */
  entity_id: string;
  /** Current state of the entity */
  state: string;
  /** Entity attributes */
  attributes: {
    /** Human-readable name */
    friendly_name?: string;
    /** Entity description */
    description?: string;
    /** Additional attributes */
    [key: string]: any;
  };
}

/**
 * Home Assistant add-on interface
 * @interface HassAddon
 */
export interface HassAddon {
  /** Add-on name */
  name: string;
  /** Add-on slug identifier */
  slug: string;
  /** Add-on description */
  description: string;
  /** Add-on version */
  version: string;
  /** Whether the add-on is installed */
  installed: boolean;
  /** Whether the add-on is available */
  available: boolean;
  /** Current state of the add-on */
  state: string;
}

/**
 * Response from Home Assistant add-on API
 * @interface HassAddonResponse
 */
export interface HassAddonResponse {
  /** Response data */
  data: {
    /** List of add-ons */
    addons: HassAddon[];
  };
}

/**
 * Response from Home Assistant add-on info API
 * @interface HassAddonInfoResponse
 */
export interface HassAddonInfoResponse {
  /** Response data */
  data: {
    /** Add-on name */
    name: string;
    /** Add-on slug identifier */
    slug: string;
    /** Add-on description */
    description: string;
    /** Add-on version */
    version: string;
    /** Current state */
    state: string;
    /** Status information */
    status: string;
    /** Add-on options */
    options: Record<string, any>;
    /** Additional properties */
    [key: string]: any;
  };
}

/**
 * HACS repository interface
 * @interface HacsRepository
 */
export interface HacsRepository {
  /** Repository name */
  name: string;
  /** Repository description */
  description: string;
  /** Repository category */
  category: string;
  /** Whether the repository is installed */
  installed: boolean;
  /** Installed version */
  version_installed: string;
  /** Available version */
  available_version: string;
  /** Repository authors */
  authors: string[];
  /** Repository domain */
  domain: string;
}

/**
 * Response from HACS API
 * @interface HacsResponse
 */
export interface HacsResponse {
  /** List of repositories */
  repositories: HacsRepository[];
}

/**
 * Automation configuration interface
 * @interface AutomationConfig
 */
export interface AutomationConfig {
  /** Automation name */
  alias: string;
  /** Automation description */
  description?: string;
  /** How multiple triggers are handled */
  mode?: "single" | "parallel" | "queued" | "restart";
  /** List of triggers */
  trigger: any[];
  /** List of conditions */
  condition?: any[];
  /** List of actions */
  action: any[];
}

/**
 * Response from automation API
 * @interface AutomationResponse
 */
export interface AutomationResponse {
  /** Created/updated automation ID */
  automation_id: string;
}

/**
 * SSE headers interface
 * @interface SSEHeaders
 */
export interface SSEHeaders {
  /** Callback for connection abort */
  onAbort?: () => void;
}

/**
 * SSE parameters interface
 * @interface SSEParams
 */
export interface SSEParams {
  /** Authentication token */
  token: string;
  /** Event types to subscribe to */
  events?: string[];
  /** Entity ID to monitor */
  entity_id?: string;
  /** Domain to monitor */
  domain?: string;
}

/**
 * History query parameters
 * @interface HistoryParams
 */
export interface HistoryParams {
  /** Entity ID to get history for */
  entity_id: string;
  /** Start time in ISO format */
  start_time?: string;
  /** End time in ISO format */
  end_time?: string;
  /** Whether to return minimal response */
  minimal_response?: boolean;
  /** Whether to only return significant changes */
  significant_changes_only?: boolean;
}

/**
 * Scene management parameters
 * @interface SceneParams
 */
export interface SceneParams {
  /** Action to perform */
  action: "list" | "activate";
  /** Scene ID for activation */
  scene_id?: string;
}

/**
 * Notification parameters
 * @interface NotifyParams
 */
export interface NotifyParams {
  /** Notification message */
  message: string;
  /** Notification title */
  title?: string;
  /** Notification target */
  target?: string;
  /** Additional notification data */
  data?: Record<string, any>;
}

/**
 * Automation management parameters
 * @interface AutomationParams
 */
export interface AutomationParams {
  /** Action to perform */
  action: "list" | "toggle" | "trigger";
  /** Automation ID */
  automation_id?: string;
}

/**
 * Add-on management parameters
 * @interface AddonParams
 */
export interface AddonParams {
  /** Action to perform */
  action:
    | "list"
    | "info"
    | "install"
    | "uninstall"
    | "start"
    | "stop"
    | "restart";
  /** Add-on slug */
  slug?: string;
  /** Version to install */
  version?: string;
}

/**
 * Package management parameters
 * @interface PackageParams
 */
export interface PackageParams {
  /** Action to perform */
  action: "list" | "install" | "uninstall" | "update";
  /** Package category */
  category:
    | "integration"
    | "plugin"
    | "theme"
    | "python_script"
    | "appdaemon"
    | "netdaemon";
  /** Repository URL or name */
  repository?: string;
  /** Version to install */
  version?: string;
}

/**
 * Automation configuration parameters
 * @interface AutomationConfigParams
 */
export interface AutomationConfigParams {
  /** Action to perform */
  action: "create" | "update" | "delete" | "duplicate";
  /** Automation ID */
  automation_id?: string;
  /** Automation configuration */
  config?: {
    /** Automation name */
    alias: string;
    /** Automation description */
    description?: string;
    /** How multiple triggers are handled */
    mode?: "single" | "parallel" | "queued" | "restart";
    /** List of triggers */
    trigger: any[];
    /** List of conditions */
    condition?: any[];
    /** List of actions */
    action: any[];
  };
}
