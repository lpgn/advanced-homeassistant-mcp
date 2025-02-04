import type { HassEntity } from "../interfaces/hass.js";

class HomeAssistantAPI {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.HASS_HOST || "http://localhost:8123";
    this.token = process.env.HASS_TOKEN || "";

    if (!this.token || this.token === "your_hass_token_here") {
      throw new Error("HASS_TOKEN is required but not set in environment variables");
    }

    console.log(`Initializing Home Assistant API with base URL: ${this.baseUrl}`);
  }

  private async fetchApi(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/${endpoint}`;
    console.log(`Making request to: ${url}`);
    console.log('Request options:', {
      method: options.method || 'GET',
      headers: {
        Authorization: 'Bearer [REDACTED]',
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.parse(options.body as string) : undefined
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Home Assistant API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Home Assistant API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('Failed to make request:', error);
      throw error;
    }
  }

  async getStates(): Promise<HassEntity[]> {
    return this.fetchApi("states");
  }

  async getState(entityId: string): Promise<HassEntity> {
    return this.fetchApi(`states/${entityId}`);
  }

  async callService(domain: string, service: string, data: Record<string, any>): Promise<void> {
    await this.fetchApi(`services/${domain}/${service}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

let instance: HomeAssistantAPI | null = null;

export async function get_hass() {
  if (!instance) {
    try {
      instance = new HomeAssistantAPI();
      // Verify connection by trying to get states
      await instance.getStates();
      console.log('Successfully connected to Home Assistant');
    } catch (error) {
      console.error('Failed to initialize Home Assistant connection:', error);
      instance = null;
      throw error;
    }
  }
  return instance;
}

// Helper function to call Home Assistant services
export async function call_service(
  domain: string,
  service: string,
  data: Record<string, any>,
) {
  const hass = await get_hass();
  return hass.callService(domain, service, data);
}

// Helper function to list devices
export async function list_devices() {
  const hass = await get_hass();
  const states = await hass.getStates();
  return states.map((state: HassEntity) => ({
    entity_id: state.entity_id,
    state: state.state,
    attributes: state.attributes
  }));
}

// Helper function to get entity states
export async function get_states() {
  const hass = await get_hass();
  return hass.getStates();
}

// Helper function to get a specific entity state
export async function get_state(entity_id: string) {
  const hass = await get_hass();
  return hass.getState(entity_id);
}
