import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import type { HassInstanceImpl } from '../../src/hass/types.js';
import type { Entity } from '../../src/types/hass.js';
import { get_hass } from '../../src/hass/index.js';
import { HassWebSocketClient } from '../../src/websocket/client.js';
import { HomeAssistantAPI } from '../../src/hass/index.js';

// Define WebSocket mock types
type WebSocketCallback = (...args: any[]) => void;

interface MockHassServices {
    light: Record<string, unknown>;
    climate: Record<string, unknown>;
    switch: Record<string, unknown>;
    media_player: Record<string, unknown>;
}

interface MockHassInstance {
    services: MockHassServices;
}

// Extend HassInstanceImpl for testing
interface TestHassInstance extends HassInstanceImpl {
    _baseUrl: string;
    _token: string;
}

// Mock fetch globally
const mockFetch = mock() as typeof fetch;
global.fetch = mockFetch;

const mockState: Entity = {
    entity_id: 'light.test',
    state: 'on',
    attributes: {},
    last_changed: '',
    last_updated: '',
    context: {
        id: '',
        parent_id: null,
        user_id: null
    }
};

// Mock get_hass
mock.module('../../src/hass/index.js', () => {
    const mockInstance = {
        baseUrl: 'http://localhost:8123',
        token: 'test_token',
        getStates: mock(async () => [mockState]),
        getState: mock(async () => mockState),
        callService: mock(async () => {})
    };
    return {
        get_hass: mock(async () => mockInstance)
    };
});

describe('Home Assistant Integration', () => {
    describe('HomeAssistantAPI', () => {
        let instance: {
            baseUrl: string;
            token: string;
            getStates: any;
            getState: any;
            callService: any;
        };
        const mockBaseUrl = 'http://localhost:8123';
        const mockToken = 'test_token';

        beforeEach(async () => {
            instance = await get_hass();
            mock.restore();
        });

        test('should create instance with correct properties', () => {
            expect(instance.baseUrl).toBe(mockBaseUrl);
            expect(instance.token).toBe(mockToken);
        });

        test('should fetch states', async () => {
            const states = await instance.getStates();
            expect(states).toEqual([mockState]);
        });

        test('should call service', async () => {
            await instance.callService('light', 'turn_on', { entity_id: 'light.test' });
            expect(instance.callService).toHaveBeenCalledWith('light', 'turn_on', { entity_id: 'light.test' });
        });
    });
}); 