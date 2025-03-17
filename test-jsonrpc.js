#!/usr/bin/env node

/**
 * JSON-RPC 2.0 Test Script for MCP Server
 * 
 * This script tests the stdio transport communication with the MCP server
 * by sending JSON-RPC 2.0 requests and processing responses.
 * 
 * Usage:
 *   ./stdio-start.sh | node test-jsonrpc.js
 *   or
 *   node test-jsonrpc.js < sample-responses.json
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Generate a random request ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Counter for keeping track of requests/responses
let messageCount = 0;
let pendingRequests = new Map();

// Set up readline interface for stdin
const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
});

// Handle responses from the MCP server
rl.on('line', (line) => {
    try {
        const response = JSON.parse(line);
        messageCount++;

        console.log(`\n[RECEIVED] Response #${messageCount}:`);
        console.dir(response, { depth: null, colors: true });

        // Check if this is a notification
        if (!response.id && response.method) {
            console.log(`👉 Received notification: ${response.method}`);
            return;
        }

        // Check if this is a response to a pending request
        if (response.id && pendingRequests.has(response.id)) {
            const requestTime = pendingRequests.get(response.id);
            const responseTime = Date.now();
            console.log(`⏱️  Response time: ${responseTime - requestTime}ms`);
            pendingRequests.delete(response.id);
        }

        // Check for error
        if (response.error) {
            console.log(`❌ Error [${response.error.code}]: ${response.error.message}`);
        } else if (response.result) {
            console.log(`✅ Success`);
        }
    } catch (error) {
        console.error(`Error parsing response: ${error.message}`);
        console.error(`Raw response: ${line}`);
    }
});

// Define test requests
const testRequests = [
    // Test valid request
    {
        jsonrpc: "2.0",
        id: generateId(),
        method: "listDevicesTool",
        params: {
            entity_type: "light"
        }
    },

    // Test method not found
    {
        jsonrpc: "2.0",
        id: generateId(),
        method: "nonexistentMethod",
        params: {}
    },

    // Test invalid params
    {
        jsonrpc: "2.0",
        id: generateId(),
        method: "controlTool",
        params: {
            // Missing required parameters
        }
    },

    // Test notification (no response expected)
    {
        jsonrpc: "2.0",
        method: "ping",
        params: {
            timestamp: Date.now()
        }
    },

    // Test malformed request (missing jsonrpc version)
    {
        id: generateId(),
        method: "listDevicesTool",
        params: {}
    }
];

// Send requests with delay between each
let requestIndex = 0;

function sendNextRequest() {
    if (requestIndex >= testRequests.length) {
        console.log('\n✨ All test requests sent!');
        return;
    }

    const request = testRequests[requestIndex++];
    console.log(`\n[SENDING] Request #${requestIndex}:`);
    console.dir(request, { depth: null, colors: true });

    // Store the request time for calculating response time
    if (request.id) {
        pendingRequests.set(request.id, Date.now());
    }

    // Send the request to the MCP server
    process.stdout.write(JSON.stringify(request) + '\n');

    // Schedule the next request
    setTimeout(sendNextRequest, 1000);
}

// Start sending test requests after a delay to allow server initialization
console.log('🚀 Starting JSON-RPC 2.0 test...');
setTimeout(sendNextRequest, 2000);

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n👋 Test script terminated');
    process.exit(0);
}); 