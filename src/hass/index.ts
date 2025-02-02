import { CreateApplication, TServiceParams, ServiceFunction, AlsExtension, GetApisResult, ILogger, InternalDefinition, TContext, TInjectedConfig, TLifecycleBase, TScheduler } from "@digital-alchemy/core";
import { Area, Backup, CallProxy, Configure, Device, EntityManager, EventsService, FetchAPI, FetchInternals, Floor, IDByExtension, Label, LIB_HASS, ReferenceService, Registry, WebsocketAPI, Zone } from "@digital-alchemy/hass";
import { DomainSchema } from "../schemas.js";
import { HASS_CONFIG } from "../config/index.js";
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as HomeAssistant from '../types/hass.js';
import { HassEntity, HassEvent, HassService } from '../interfaces/hass.js';

type Environments = "development" | "production" | "test";

// Define the type for Home Assistant services
type HassServiceMethod = (data: Record<string, unknown>) => Promise<void>;

type HassServices = {
  [K in keyof typeof DomainSchema.Values]: {
    [service: string]: HassServiceMethod;
  };
};

// Define the type for Home Assistant instance
interface HassInstance {
  states: {
    get: () => Promise<HassEntity[]>;
    subscribe: (callback: (states: HassEntity[]) => void) => Promise<number>;
    unsubscribe: (subscription: number) => void;
  };
  services: {
    get: () => Promise<Record<string, Record<string, HassService>>>;
    call: (domain: string, service: string, serviceData?: Record<string, any>) => Promise<void>;
  };
  connection: {
    socket: WebSocket;
    subscribeEvents: (callback: (event: HassEvent) => void, eventType?: string) => Promise<number>;
    unsubscribeEvents: (subscription: number) => void;
  };
  subscribeEvents: (callback: (event: HassEvent) => void, eventType?: string) => Promise<number>;
  unsubscribeEvents: (subscription: number) => void;
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

export interface HassConfig {
  host: string;
  token: string;
}

const CONFIG: Record<string, HassConfig> = {
  development: {
    host: process.env.HASS_HOST || 'http://localhost:8123',
    token: process.env.HASS_TOKEN || ''
  },
  production: {
    host: process.env.HASS_HOST || '',
    token: process.env.HASS_TOKEN || ''
  },
  test: {
    host: 'http://localhost:8123',
    token: 'test_token'
  }
};

export class HassWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private messageId = 1;
  private subscriptions = new Map<number, (data: any) => void>();
  private reconnectAttempts = 0;
  private options: {
    autoReconnect: boolean;
    maxReconnectAttempts: number;
    reconnectDelay: number;
  };

  constructor(
    private url: string,
    private token: string,
    options: Partial<typeof HassWebSocketClient.prototype.options> = {}
  ) {
    super();
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 3,
      reconnectDelay: 1000,
      ...options
    };
  }

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        this.emit('open');
        const authMessage: HomeAssistant.AuthMessage = {
          type: 'auth',
          access_token: this.token
        };
        this.ws?.send(JSON.stringify(authMessage));
      });

      this.ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(message);
        } catch (error) {
          this.emit('error', new Error('Failed to parse message'));
        }
      });

      this.ws.on('close', () => {
        this.emit('disconnected');
        if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, this.options.reconnectDelay);
        }
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'auth_ok':
        this.emit('auth_ok');
        break;
      case 'auth_invalid':
        this.emit('auth_invalid');
        break;
      case 'result':
        // Handle command results
        break;
      case 'event':
        if (message.event) {
          this.emit('event', message.event);
          const subscription = this.subscriptions.get(message.id);
          if (subscription) {
            subscription(message.event.data);
          }
        }
        break;
      default:
        this.emit('error', new Error(`Unknown message type: ${message.type}`));
    }
  }

  async subscribeEvents(callback: (data: any) => void, eventType?: string): Promise<number> {
    const id = this.messageId++;
    const message = {
      id,
      type: 'subscribe_events',
      event_type: eventType
    };

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.subscriptions.set(id, callback);
      this.ws.send(JSON.stringify(message));
      resolve(id);
    });
  }

  async unsubscribeEvents(subscriptionId: number): Promise<void> {
    const message = {
      id: this.messageId++,
      type: 'unsubscribe_events',
      subscription: subscriptionId
    };

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.ws.send(JSON.stringify(message));
      this.subscriptions.delete(subscriptionId);
      resolve();
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export class HassInstanceImpl implements HassInstance {
  public readonly baseUrl: string;
  public readonly token: string;
  public wsClient: HassWebSocketClient | undefined;

  public services!: HassServices;
  public als!: AlsExtension;
  public context!: TContext;
  public event!: EventEmitter<[never]>;
  public internal!: InternalDefinition;
  public lifecycle!: TLifecycleBase;
  public logger!: ILogger;
  public scheduler!: TScheduler;
  public config!: TInjectedConfig;
  public params!: TServiceParams;
  public hass!: GetApisResult<{
    area: typeof Area;
    backup: typeof Backup;
    call: typeof CallProxy;
    configure: typeof Configure;
    device: typeof Device;
    entity: typeof EntityManager;
    events: typeof EventsService;
    fetch: typeof FetchAPI;
    floor: typeof Floor;
    idBy: typeof IDByExtension;
    internals: typeof FetchInternals;
    label: typeof Label;
    refBy: typeof ReferenceService;
    registry: typeof Registry;
    socket: typeof WebsocketAPI;
    zone: typeof Zone;
  }>;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.initialize();
  }

  private initialize() {
    // Initialize all required properties with proper type instantiation
    this.services = {} as HassServices;
    this.als = {} as AlsExtension;
    this.context = {} as TContext;
    this.event = new EventEmitter();
    this.internal = {} as InternalDefinition;
    this.lifecycle = {} as TLifecycleBase;
    this.logger = {} as ILogger;
    this.scheduler = {} as TScheduler;
    this.config = {} as TInjectedConfig;
    this.params = {} as TServiceParams;
    this.hass = {} as GetApisResult<any>;
  }

  async fetchStates(): Promise<HomeAssistant.Entity[]> {
    const response = await fetch(`${this.baseUrl}/api/states`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch states: ${response.statusText}`);
    }

    const data = await response.json();
    return data as HomeAssistant.Entity[];
  }

  async fetchState(entityId: string): Promise<HomeAssistant.Entity> {
    const response = await fetch(`${this.baseUrl}/api/states/${entityId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch state: ${response.statusText}`);
    }

    const data = await response.json();
    return data as HomeAssistant.Entity;
  }

  async callService(domain: string, service: string, data: Record<string, any>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Service call failed: ${response.statusText}`);
    }
  }

  async subscribeEvents(callback: (event: HomeAssistant.Event) => void, eventType?: string): Promise<number> {
    if (!this.wsClient) {
      this.wsClient = new HassWebSocketClient(
        this.baseUrl.replace(/^http/, 'ws') + '/api/websocket',
        this.token
      );
      await this.wsClient.connect();
    }

    return this.wsClient.subscribeEvents(callback, eventType);
  }

  async unsubscribeEvents(subscriptionId: number): Promise<void> {
    if (this.wsClient) {
      await this.wsClient.unsubscribeEvents(subscriptionId);
    }
  }
}

class HomeAssistantInstance implements HassInstance {
  private messageId = 1;
  private messageCallbacks = new Map<number, (result: any) => void>();
  private eventCallbacks = new Map<number, (event: HassEvent) => void>();
  private stateCallbacks = new Map<number, (states: HassEntity[]) => void>();
  private _authenticated = false;
  private socket: WebSocket;
  private readonly _states: HassInstance['states'];
  private readonly _services: HassInstance['services'];
  private readonly _connection: HassInstance['connection'];

  constructor() {
    if (!HASS_CONFIG.TOKEN) {
      throw new Error('Home Assistant token is required');
    }

    this.socket = new WebSocket(HASS_CONFIG.SOCKET_URL);

    this._states = {
      get: async (): Promise<HassEntity[]> => {
        const message = {
          type: 'get_states'
        };
        return this.sendMessage(message);
      },

      subscribe: async (callback: (states: HassEntity[]) => void): Promise<number> => {
        const id = this.messageId++;
        this.stateCallbacks.set(id, callback);

        const message = {
          type: 'subscribe_events',
          event_type: 'state_changed'
        };

        await this.sendMessage(message);
        return id;
      },

      unsubscribe: (subscription: number): void => {
        this.stateCallbacks.delete(subscription);
      }
    };

    this._services = {
      get: async (): Promise<Record<string, Record<string, HassService>>> => {
        const message = {
          type: 'get_services'
        };
        return this.sendMessage(message);
      },

      call: async (domain: string, service: string, serviceData?: Record<string, any>): Promise<void> => {
        const message = {
          type: 'call_service',
          domain,
          service,
          service_data: serviceData
        };
        await this.sendMessage(message);
      }
    };

    this._connection = {
      socket: this.socket,
      subscribeEvents: this.subscribeEvents.bind(this),
      unsubscribeEvents: this.unsubscribeEvents.bind(this)
    };

    this.setupWebSocket();
  }

  get authenticated(): boolean {
    return this._authenticated;
  }

  get states(): HassInstance['states'] {
    return this._states;
  }

  get services(): HassInstance['services'] {
    return this._services;
  }

  get connection(): HassInstance['connection'] {
    return this._connection;
  }

  private setupWebSocket() {
    this.socket.on('open', () => {
      this.authenticate();
    });

    this.socket.on('message', (data: WebSocket.Data) => {
      if (typeof data === 'string') {
        const message = JSON.parse(data);
        this.handleMessage(message);
      }
    });

    this.socket.on('close', () => {
      console.log('WebSocket connection closed');
      // Implement reconnection logic here
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private authenticate() {
    const auth = {
      type: 'auth',
      access_token: HASS_CONFIG.TOKEN
    };
    this.socket.send(JSON.stringify(auth));
  }

  private handleMessage(message: any) {
    if (message.type === 'auth_ok') {
      this._authenticated = true;
      console.log('Authenticated with Home Assistant');
      return;
    }

    if (message.type === 'auth_invalid') {
      console.error('Authentication failed:', message.message);
      return;
    }

    if (message.type === 'event') {
      const callback = this.eventCallbacks.get(message.id);
      if (callback) {
        callback(message.event);
      }
      return;
    }

    if (message.type === 'result') {
      const callback = this.messageCallbacks.get(message.id);
      if (callback) {
        callback(message.result);
        this.messageCallbacks.delete(message.id);
      }
      return;
    }
  }

  private async sendMessage(message: any): Promise<any> {
    if (!this._authenticated) {
      throw new Error('Not authenticated with Home Assistant');
    }

    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      message.id = id;

      this.messageCallbacks.set(id, resolve);
      this.socket.send(JSON.stringify(message));

      // Add timeout
      setTimeout(() => {
        this.messageCallbacks.delete(id);
        reject(new Error('Message timeout'));
      }, 10000);
    });
  }

  public async subscribeEvents(callback: (event: HassEvent) => void, eventType?: string): Promise<number> {
    const id = this.messageId++;
    this.eventCallbacks.set(id, callback);

    const message = {
      type: 'subscribe_events',
      event_type: eventType
    };

    await this.sendMessage(message);
    return id;
  }

  public unsubscribeEvents(subscription: number): void {
    this.eventCallbacks.delete(subscription);
  }
}

let hassInstance: HomeAssistantInstance | null = null;

export async function get_hass(): Promise<HassInstance> {
  if (!hassInstance) {
    hassInstance = new HomeAssistantInstance();
    // Wait for authentication
    await new Promise<void>((resolve) => {
      const checkAuth = () => {
        if (hassInstance?.authenticated) {
          resolve();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }
  return hassInstance;
}