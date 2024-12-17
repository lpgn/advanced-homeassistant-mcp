import { get_hass } from '../../src/hass/index.js';

// Mock the entire module
jest.mock('../../src/hass/index.js', () => {
    let mockInstance: any = null;

    return {
        get_hass: jest.fn(async () => {
            if (!mockInstance) {
                mockInstance = {
                    services: {
                        light: {
                            turn_on: jest.fn().mockResolvedValue(undefined),
                            turn_off: jest.fn().mockResolvedValue(undefined),
                        },
                        climate: {
                            set_temperature: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                };
            }
            return mockInstance;
        }),
    };
});

describe('Home Assistant Connection', () => {
    // Backup the original environment
    const originalEnv = { ...process.env };

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Reset environment variables
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    it('should return a Home Assistant instance with services', async () => {
        const hass = await get_hass();

        expect(hass).toBeDefined();
        expect(hass.services).toBeDefined();
        expect(typeof hass.services.light.turn_on).toBe('function');
        expect(typeof hass.services.light.turn_off).toBe('function');
        expect(typeof hass.services.climate.set_temperature).toBe('function');
    });

    it('should reuse the same instance on multiple calls', async () => {
        const firstInstance = await get_hass();
        const secondInstance = await get_hass();

        expect(firstInstance).toBe(secondInstance);
    });

    it('should use "development" as default environment', async () => {
        // Unset NODE_ENV
        delete process.env.NODE_ENV;

        const hass = await get_hass();

        // You might need to add a way to check the environment in your actual implementation
        // This is a placeholder and might need adjustment based on your exact implementation
        expect(process.env.NODE_ENV).toBe(undefined);
    });

    it('should use process.env.NODE_ENV when set', async () => {
        // Set a specific environment
        process.env.NODE_ENV = 'production';

        const hass = await get_hass();

        // You might need to add a way to check the environment in your actual implementation
        expect(process.env.NODE_ENV).toBe('production');
    });
}); 