import { describe, expect, test } from "bun:test";
import { entitySchema, serviceSchema, stateChangedEventSchema, configSchema, automationSchema, deviceControlSchema } from '../../src/schemas/hass.js';
import Ajv from 'ajv';
import { describe, expect, test } from "bun:test";

const ajv = new Ajv();

// Create validation functions for each schema
const validateEntity = ajv.compile(entitySchema);
const validateService = ajv.compile(serviceSchema);

describe('Home Assistant Schemas', () => {
    describe('Entity Schema', () => {
        test('should validate a valid entity', () => {
            const validEntity = {
                entity_id: 'light.living_room',
                state: 'on',
                attributes: {
                    brightness: 255,
                    friendly_name: 'Living Room Light'
                },
                last_changed: '2024-01-01T00:00:00Z',
                last_updated: '2024-01-01T00:00:00Z',
                context: {
                    id: '123456',
                    parent_id: null,
                    user_id: null
                }
            };
            expect(validateEntity(validEntity)).toBe(true);
        });

        test('should reject entity with missing required fields', () => {
            const invalidEntity = {
                entity_id: 'light.living_room',
                state: 'on'
                // missing attributes, last_changed, last_updated, context
            };
            expect(validateEntity(invalidEntity)).toBe(false);
            expect(validateEntity.errors).toBeDefined();
        });

        test('should validate entity with additional attributes', () => {
            const validEntity = {
                entity_id: 'light.living_room',
                state: 'on',
                attributes: {
                    brightness: 100,
                    color_mode: 'brightness'
                },
                last_changed: '2024-01-01T00:00:00Z',
                last_updated: '2024-01-01T00:00:00Z',
                context: {
                    id: '123456',
                    parent_id: null,
                    user_id: null
                }
            };
            expect(validateEntity(validEntity)).toBe(true);
        });

        test('should reject invalid entity_id format', () => {
            const invalidEntity = {
                entity_id: 'invalid_entity',
                state: 'on',
                attributes: {},
                last_changed: '2024-01-01T00:00:00Z',
                last_updated: '2024-01-01T00:00:00Z',
                context: {
                    id: '123456',
                    parent_id: null,
                    user_id: null
                }
            };
            expect(validateEntity(invalidEntity)).toBe(false);
        });
    });

    describe('Service Schema', () => {
        test('should validate a basic service call', () => {
            const basicService = {
                domain: 'light',
                service: 'turn_on',
                target: {
                    entity_id: ['light.living_room']
                },
                service_data: {
                    brightness_pct: 100
                }
            };
            expect(validateService(basicService)).toBe(true);
        });

        test('should validate service call with multiple targets', () => {
            const multiTargetService = {
                domain: 'light',
                service: 'turn_on',
                target: {
                    entity_id: ['light.living_room', 'light.kitchen'],
                    device_id: ['device123', 'device456'],
                    area_id: ['living_room', 'kitchen']
                },
                service_data: {
                    brightness_pct: 100
                }
            };
            expect(validateService(multiTargetService)).toBe(true);
        });

        test('should validate service call without targets', () => {
            const noTargetService = {
                domain: 'homeassistant',
                service: 'restart'
            };
            expect(validateService(noTargetService)).toBe(true);
        });

        test('should reject service call with invalid target type', () => {
            const invalidService = {
                domain: 'light',
                service: 'turn_on',
                target: {
                    entity_id: 'not_an_array' // should be an array
                }
            };
            expect(validateService(invalidService)).toBe(false);
            expect(validateService.errors).toBeDefined();
        });

        test('should reject service call with invalid domain', () => {
            const invalidService = {
                domain: 'invalid_domain',
                service: 'turn_on',
                target: {
                    entity_id: ['light.living_room']
                }
            };
            expect(validateService(invalidService)).toBe(false);
        });
    });

    describe('State Changed Event Schema', () => {
        const validate = ajv.compile(stateChangedEventSchema);

        test('should validate a valid state changed event', () => {
            const validEvent = {
                event_type: 'state_changed',
                data: {
                    entity_id: 'light.living_room',
                    new_state: {
                        entity_id: 'light.living_room',
                        state: 'on',
                        attributes: {
                            brightness: 255
                        },
                        last_changed: '2024-01-01T00:00:00Z',
                        last_updated: '2024-01-01T00:00:00Z',
                        context: {
                            id: '123456',
                            parent_id: null,
                            user_id: null
                        }
                    },
                    old_state: {
                        entity_id: 'light.living_room',
                        state: 'off',
                        attributes: {},
                        last_changed: '2024-01-01T00:00:00Z',
                        last_updated: '2024-01-01T00:00:00Z',
                        context: {
                            id: '123456',
                            parent_id: null,
                            user_id: null
                        }
                    }
                },
                origin: 'LOCAL',
                time_fired: '2024-01-01T00:00:00Z',
                context: {
                    id: '123456',
                    parent_id: null,
                    user_id: null
                }
            };
            expect(validate(validEvent)).toBe(true);
        });

        test('should validate event with null old_state', () => {
            const newEntityEvent = {
                event_type: 'state_changed',
                data: {
                    entity_id: 'light.living_room',
                    new_state: {
                        entity_id: 'light.living_room',
                        state: 'on',
                        attributes: {},
                        last_changed: '2024-01-01T00:00:00Z',
                        last_updated: '2024-01-01T00:00:00Z',
                        context: {
                            id: '123456',
                            parent_id: null,
                            user_id: null
                        }
                    },
                    old_state: null
                },
                origin: 'LOCAL',
                time_fired: '2024-01-01T00:00:00Z',
                context: {
                    id: '123456',
                    parent_id: null,
                    user_id: null
                }
            };
            expect(validate(newEntityEvent)).toBe(true);
        });

        test('should reject event with invalid event_type', () => {
            const invalidEvent = {
                event_type: 'wrong_type',
                data: {
                    entity_id: 'light.living_room',
                    new_state: null,
                    old_state: null
                },
                origin: 'LOCAL',
                time_fired: '2024-01-01T00:00:00Z',
                context: {
                    id: '123456',
                    parent_id: null,
                    user_id: null
                }
            };
            expect(validate(invalidEvent)).toBe(false);
            expect(validate.errors).toBeDefined();
        });
    });

    describe('Config Schema', () => {
        const validate = ajv.compile(configSchema);

        test('should validate a minimal config', () => {
            const minimalConfig = {
                latitude: 52.3731,
                longitude: 4.8922,
                elevation: 0,
                unit_system: {
                    length: 'km',
                    mass: 'kg',
                    temperature: '°C',
                    volume: 'L'
                },
                location_name: 'Home',
                time_zone: 'Europe/Amsterdam',
                components: ['homeassistant'],
                version: '2024.1.0'
            };
            expect(validate(minimalConfig)).toBe(true);
        });

        test('should reject config with missing required fields', () => {
            const invalidConfig = {
                latitude: 52.3731,
                longitude: 4.8922
                // missing other required fields
            };
            expect(validate(invalidConfig)).toBe(false);
            expect(validate.errors).toBeDefined();
        });

        test('should reject config with invalid types', () => {
            const invalidConfig = {
                latitude: '52.3731', // should be number
                longitude: 4.8922,
                elevation: 0,
                unit_system: {
                    length: 'km',
                    mass: 'kg',
                    temperature: '°C',
                    volume: 'L'
                },
                location_name: 'Home',
                time_zone: 'Europe/Amsterdam',
                components: ['homeassistant'],
                version: '2024.1.0'
            };
            expect(validate(invalidConfig)).toBe(false);
            expect(validate.errors).toBeDefined();
        });
    });

    describe('Automation Schema', () => {
        const validate = ajv.compile(automationSchema);

        test('should validate a basic automation', () => {
            const basicAutomation = {
                alias: 'Turn on lights at sunset',
                description: 'Automatically turn on lights when the sun sets',
                trigger: [{
                    platform: 'sun',
                    event: 'sunset',
                    offset: '+00:30:00'
                }],
                action: [{
                    service: 'light.turn_on',
                    target: {
                        entity_id: ['light.living_room', 'light.kitchen']
                    },
                    data: {
                        brightness_pct: 70
                    }
                }]
            };
            expect(validate(basicAutomation)).toBe(true);
        });

        test('should validate automation with conditions', () => {
            const automationWithConditions = {
                alias: 'Conditional Light Control',
                mode: 'single',
                trigger: [{
                    platform: 'state',
                    entity_id: 'binary_sensor.motion',
                    to: 'on'
                }],
                condition: [{
                    condition: 'and',
                    conditions: [
                        {
                            condition: 'time',
                            after: '22:00:00',
                            before: '06:00:00'
                        },
                        {
                            condition: 'state',
                            entity_id: 'input_boolean.guest_mode',
                            state: 'off'
                        }
                    ]
                }],
                action: [{
                    service: 'light.turn_on',
                    target: {
                        entity_id: 'light.hallway'
                    }
                }]
            };
            expect(validate(automationWithConditions)).toBe(true);
        });

        test('should validate automation with multiple triggers and actions', () => {
            const complexAutomation = {
                alias: 'Complex Automation',
                mode: 'parallel',
                trigger: [
                    {
                        platform: 'state',
                        entity_id: 'binary_sensor.door',
                        to: 'on'
                    },
                    {
                        platform: 'state',
                        entity_id: 'binary_sensor.window',
                        to: 'on'
                    }
                ],
                condition: [{
                    condition: 'state',
                    entity_id: 'alarm_control_panel.home',
                    state: 'armed_away'
                }],
                action: [
                    {
                        service: 'notify.mobile_app',
                        data: {
                            message: 'Security alert: Movement detected!'
                        }
                    },
                    {
                        service: 'light.turn_on',
                        target: {
                            entity_id: 'light.all_lights'
                        }
                    },
                    {
                        service: 'camera.snapshot',
                        target: {
                            entity_id: 'camera.front_door'
                        }
                    }
                ]
            };
            expect(validate(complexAutomation)).toBe(true);
        });

        test('should reject automation without required fields', () => {
            const invalidAutomation = {
                description: 'Missing required fields'
                // missing alias, trigger, and action
            };
            expect(validate(invalidAutomation)).toBe(false);
            expect(validate.errors).toBeDefined();
        });

        test('should validate all automation modes', () => {
            const modes = ['single', 'parallel', 'queued', 'restart'];
            modes.forEach(mode => {
                const automation = {
                    alias: `Test ${mode} mode`,
                    mode,
                    trigger: [{
                        platform: 'state',
                        entity_id: 'input_boolean.test',
                        to: 'on'
                    }],
                    action: [{
                        service: 'light.turn_on',
                        target: {
                            entity_id: 'light.test'
                        }
                    }]
                };
                expect(validate(automation)).toBe(true);
            });
        });
    });

    describe('Device Control Schema', () => {
        const validate = ajv.compile(deviceControlSchema);

        test('should validate light control command', () => {
            const lightCommand = {
                domain: 'light',
                command: 'turn_on',
                entity_id: 'light.living_room',
                parameters: {
                    brightness: 255,
                    color_temp: 400,
                    transition: 2
                }
            };
            expect(validate(lightCommand)).toBe(true);
        });

        test('should validate climate control command', () => {
            const climateCommand = {
                domain: 'climate',
                command: 'set_temperature',
                entity_id: 'climate.living_room',
                parameters: {
                    temperature: 22.5,
                    hvac_mode: 'heat',
                    target_temp_high: 24,
                    target_temp_low: 20
                }
            };
            expect(validate(climateCommand)).toBe(true);
        });

        test('should validate cover control command', () => {
            const coverCommand = {
                domain: 'cover',
                command: 'set_position',
                entity_id: 'cover.garage_door',
                parameters: {
                    position: 50,
                    tilt_position: 45
                }
            };
            expect(validate(coverCommand)).toBe(true);
        });

        test('should validate fan control command', () => {
            const fanCommand = {
                domain: 'fan',
                command: 'set_speed',
                entity_id: 'fan.bedroom',
                parameters: {
                    speed: 'medium',
                    oscillating: true,
                    direction: 'forward'
                }
            };
            expect(validate(fanCommand)).toBe(true);
        });

        test('should reject command with invalid domain', () => {
            const invalidCommand = {
                domain: 'invalid_domain',
                command: 'turn_on',
                entity_id: 'light.living_room'
            };
            expect(validate(invalidCommand)).toBe(false);
            expect(validate.errors).toBeDefined();
        });

        test('should reject command with mismatched domain and entity_id', () => {
            const mismatchedCommand = {
                domain: 'light',
                command: 'turn_on',
                entity_id: 'switch.living_room' // mismatched domain
            };
            expect(validate(mismatchedCommand)).toBe(false);
        });

        test('should validate command with array of entity_ids', () => {
            const multiEntityCommand = {
                domain: 'light',
                command: 'turn_on',
                entity_id: ['light.living_room', 'light.kitchen'],
                parameters: {
                    brightness: 255
                }
            };
            expect(validate(multiEntityCommand)).toBe(true);
        });

        test('should validate scene activation command', () => {
            const sceneCommand = {
                domain: 'scene',
                command: 'turn_on',
                entity_id: 'scene.movie_night',
                parameters: {
                    transition: 2
                }
            };
            expect(validate(sceneCommand)).toBe(true);
        });

        test('should validate script execution command', () => {
            const scriptCommand = {
                domain: 'script',
                command: 'turn_on',
                entity_id: 'script.welcome_home',
                parameters: {
                    variables: {
                        user: 'John',
                        delay: 5
                    }
                }
            };
            expect(validate(scriptCommand)).toBe(true);
        });
    });
}); 