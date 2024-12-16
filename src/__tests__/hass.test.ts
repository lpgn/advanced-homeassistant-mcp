import { get_hass } from '../hass/index.js';

// Mock the entire module
jest.mock('../hass/index.js', () => {
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
    beforeEach(() => {
        jest.clearAllMocks();
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
}); 