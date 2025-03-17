#!/bin/bash

# Set silent environment variables
export LOG_LEVEL=silent
export USE_STDIO_TRANSPORT=true

# Check if we're running from npx or directly
if [ -f "./dist/stdio-server.js" ]; then
  # Direct run from project directory - use local file
  node ./dist/stdio-server.js 2>/dev/null
else 
  # Run using npx
  npx homeassistant-mcp 2>/dev/null
fi 