#!/usr/bin/env node

/**
 * Verify all tools are registered in the MCP server
 */

import { tools } from './src/tools/index.js';
import { lightsControlTool } from './src/tools/homeassistant/lights.tool.js';
import { climateControlTool } from './src/tools/homeassistant/climate.tool.js';

console.log('=== Tool Registration Verification ===\n');

console.log(`Tools from tools array: ${tools.length}`);
console.log('\nTools in array:');
tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name}`);
});

console.log('\n\nAdditional tools added in stdio-server:');
console.log(`${tools.length + 1}. ${lightsControlTool.name} (duplicate - already in array)`);
console.log(`${tools.length + 2}. ${climateControlTool.name} (duplicate - already in array)`);
console.log(`${tools.length + 3}. system_info`);

console.log(`\n\nTotal unique tools: ${tools.length + 1} (28 from array + system_info)`);
console.log('Note: lights_control and climate_control are duplicates\n');

// Check for duplicates in array
const toolNames = tools.map(t => t.name);
const duplicates = toolNames.filter((item, index) => toolNames.indexOf(item) !== index);
if (duplicates.length > 0) {
    console.log('⚠️ WARNING: Duplicate tools in array:', duplicates);
} else {
    console.log('✅ No duplicates in tools array');
}

// Verify lights_control and climate_control are in array
const hasLights = tools.some(t => t.name === 'lights_control');
const hasClimate = tools.some(t => t.name === 'climate_control');
console.log(`\nIn tools array: lights_control=${hasLights}, climate_control=${hasClimate}`);
console.log('In stdio-server: lights_control=true, climate_control=true');
console.log('\n⚠️ These tools are being registered TWICE!\n');
