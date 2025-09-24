import { describe, expect, test, mock } from "bun:test";
import { jest, it } from '@jest/globals';
import { ContextManager, ResourceType, RelationType, ResourceState } from '../../src/context/index.js';

describe('Context Manager', () => {
    describe('Resource Management', () => {
        const contextManager = new ContextManager();

        test('should add resources', () => {
            const resource: ResourceState = {
                id: 'light.living_room',
                type: ResourceType.DEVICE,
                state: 'on',
                attributes: {
                    name: 'Living Room Light'
                },
                lastUpdated: Date.now()
            };
            contextManager.addResource(resource);
            const retrievedResource = contextManager.getResource(resource.id);
            expect(retrievedResource).toEqual(resource);
        });

        test('should update resources', () => {
            const resource: ResourceState = {
                id: 'light.living_room',
                type: ResourceType.DEVICE,
                state: 'off',
                attributes: {
                    name: 'Living Room Light'
                },
                lastUpdated: Date.now()
            };
            contextManager.updateResource(resource.id, { state: 'off' });
            const retrievedResource = contextManager.getResource(resource.id);
            expect(retrievedResource?.state).toBe('off');
        });

        test('should remove resources', () => {
            const resourceId = 'light.living_room';
            contextManager.removeResource(resourceId);
            const retrievedResource = contextManager.getResource(resourceId);
            expect(retrievedResource).toBeUndefined();
        });

        test('should get resources by type', () => {
            const light1: ResourceState = {
                id: 'light.living_room',
                type: ResourceType.DEVICE,
                state: 'on',
                attributes: {
                    name: 'Living Room Light'
                },
                lastUpdated: Date.now()
            };
            const light2: ResourceState = {
                id: 'light.kitchen',
                type: ResourceType.DEVICE,
                state: 'off',
                attributes: {
                    name: 'Kitchen Light'
                },
                lastUpdated: Date.now()
            };
            contextManager.addResource(light1);
            contextManager.addResource(light2);
            const lights = contextManager.getResourcesByType(ResourceType.DEVICE);
            expect(lights).toHaveLength(2);
            expect(lights).toContainEqual(light1);
            expect(lights).toContainEqual(light2);
        });
    });

    describe('Relationship Management', () => {
        const contextManager = new ContextManager();

        test('should add relationships', () => {
            const light: ResourceState = {
                id: 'light.living_room',
                type: ResourceType.DEVICE,
                state: 'on',
                attributes: {
                    name: 'Living Room Light'
                },
                lastUpdated: Date.now()
            };
            const room: ResourceState = {
                id: 'room.living_room',
                type: ResourceType.AREA,
                state: 'active',
                attributes: {
                    name: 'Living Room'
                },
                lastUpdated: Date.now()
            };
            contextManager.addResource(light);
            contextManager.addResource(room);

            const relationship = {
                sourceId: light.id,
                targetId: room.id,
                type: RelationType.CONTAINS
            };
            contextManager.addRelationship(relationship);
            const related = contextManager.getRelatedResources(relationship.sourceId);
            expect(related.length).toBeGreaterThan(0);
            expect(related[0]).toEqual(room);
        });

        test('should remove relationships', () => {
            const sourceId = 'light.living_room';
            const targetId = 'room.living_room';
            contextManager.removeRelationship(sourceId, targetId, RelationType.CONTAINS);
            const related = contextManager.getRelatedResources(sourceId);
            expect(related).toHaveLength(0);
        });

        test('should get related resources with depth', () => {
            const light: ResourceState = {
                id: 'light.living_room',
                type: ResourceType.DEVICE,
                state: 'on',
                attributes: {
                    name: 'Living Room Light'
                },
                lastUpdated: Date.now()
            };
            const room: ResourceState = {
                id: 'room.living_room',
                type: ResourceType.AREA,
                state: 'active',
                attributes: {
                    name: 'Living Room'
                },
                lastUpdated: Date.now()
            };
            contextManager.addResource(light);
            contextManager.addResource(room);
            contextManager.addRelationship({
                sourceId: light.id,
                targetId: room.id,
                type: RelationType.CONTAINS
            });
            const relatedResources = contextManager.getRelatedResources(light.id, undefined, 1);
            expect(relatedResources).toContainEqual(room);
        });
    });

    describe('Resource Analysis', () => {
        const contextManager = new ContextManager();

        test('should analyze resource usage', () => {
            const light: ResourceState = {
                id: 'light.living_room',
                type: ResourceType.DEVICE,
                state: 'on',
                attributes: {
                    name: 'Living Room Light',
                    brightness: 255,
                    color_temp: 400
                },
                lastUpdated: Date.now()
            };
            contextManager.addResource(light);
            const analysis = contextManager.analyzeResourceUsage(light.id);
            expect(analysis).toBeDefined();
            expect(analysis.dependencies).toBeDefined();
            expect(analysis.usage).toBeDefined();
        });
    });

    describe('Event Subscriptions', () => {
        const contextManager = new ContextManager();

        test('should handle resource subscriptions', () => {
            const callback = mock();
            const resourceId = 'light.living_room';
            const resource: ResourceState = {
                id: resourceId,
                type: ResourceType.DEVICE,
                state: 'on',
                attributes: {
                    name: 'Living Room Light'
                },
                lastUpdated: Date.now()
            };
            contextManager.addResource(resource);
            contextManager.subscribeToResource(resourceId, callback);
            contextManager.updateResource(resourceId, { state: 'off' });
            expect(callback).toHaveBeenCalled();
        });

        test('should handle type subscriptions', () => {
            const callback = mock();
            const type = ResourceType.DEVICE;

            const unsubscribe = contextManager.subscribeToType(type, callback);

            const resource: ResourceState = {
                id: 'light.kitchen',
                type: ResourceType.DEVICE,
                state: 'on',
                attributes: {
                    name: 'Kitchen Light'
                },
                lastUpdated: Date.now()
            };
            contextManager.addResource(resource);

            contextManager.updateResource(resource.id, { state: 'off' });
            expect(callback).toHaveBeenCalled();

            unsubscribe();
        });
    });
}); 