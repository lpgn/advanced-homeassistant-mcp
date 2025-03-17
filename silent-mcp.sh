#!/bin/bash

# Ensure we're running in a clean environment for MCP
# Set silent environment variables
export LOG_LEVEL=silent
export USE_STDIO_TRANSPORT=true

# Explicitly mark that we are NOT in Cursor mode
export CURSOR_COMPATIBLE=false

# Flag to prevent recursive execution
export SILENT_MCP_RUNNING=true

# Clean up any existing processes - optional but can help with "already" errors
# pkill -f "node.*stdio-server" >/dev/null 2>&1 || true

# Direct execution - always use local file
if [ -f "./dist/stdio-server.js" ]; then
  # Keep stdout intact (for JSON-RPC messages) but redirect stderr to /dev/null
  node ./dist/stdio-server.js 2>/dev/null
else 
  # If no local file, run directly through node using the globally installed package
  # This avoids calling npx again which would create a loop
  node $(npm root -g)/homeassistant-mcp/dist/stdio-server.js 2>/dev/null
fi 