#!/usr/bin/env node

/**
 * Test script for MCP stdio transport
 * 
 * This script sends JSON-RPC 2.0 requests to the MCP server
 * running in stdio mode and displays the responses.
 * 
 * Usage: node test-stdio.js | node bin/mcp-stdio.cjs
 */

// Send a ping request
const pingRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "ping"
};

// Send an info request
const infoRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "info"
};

// Send an echo request
const echoRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "echo",
    params: {
        message: "Hello, MCP!",
        timestamp: new Date().toISOString(),
        test: true,
        count: 42
    }
};

// Send the requests with a delay between them
setTimeout(() => {
    console.log(JSON.stringify(pingRequest));
}, 500);

setTimeout(() => {
    console.log(JSON.stringify(infoRequest));
}, 1000);

setTimeout(() => {
    console.log(JSON.stringify(echoRequest));
}, 1500);

// Process responses
process.stdin.on('data', (data) => {
    try {
        const response = JSON.parse(data.toString());
        console.error('Received response:');
        console.error(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error('Error parsing response:', error);
        console.error('Raw data:', data.toString());
    }
}); 