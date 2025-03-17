#!/bin/bash

# Clean up any existing processes first
pkill -f "node.*stdio-server" >/dev/null 2>&1 || true

# Simulate Cursor environment by setting env variables
export CURSOR_SESSION=test-session
export CURSOR_COMPATIBLE=true
export USE_STDIO_TRANSPORT=true
export LOG_LEVEL=info

# Run npx with the simulated environment
npx homeassistant-mcp 