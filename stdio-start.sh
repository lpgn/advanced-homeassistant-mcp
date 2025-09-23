#!/bin/bash

echo "stdio-start.sh: Script started (Simplified / Absolute Path)" >&2

# --- Temporarily Disabled Checks and Build --- 
# function show_usage { ... }
# REBUILD=false
# DEBUG=false
# for arg in "$@"; do ... done
# if [ ! -f ".env" ]; then ... fi
# export USE_STDIO_TRANSPORT=true
# if [ "$DEBUG" = true ]; then ... fi
# TARGET_ENTRY="src/stdio-server.ts"
# TARGET_OUTPUT="dist/stdio-server.js"
# echo "stdio-start.sh: Checking build requirement ..." >&2
# if [ ! -f "$TARGET_OUTPUT" ] || [ "$REBUILD" = true ]; then ... else ... fi
# mkdir -p logs
# echo "stdio-start.sh: Ensured logs directory exists." >&2

# --- Directly Execute Pre-built Server --- 
WORKSPACE_ROOT="/home/jango/Git/homeassistant-mcp" # Use the absolute path to your workspace
TARGET_OUTPUT="$WORKSPACE_ROOT/dist/stdio-server.js"

# Ensure the target file exists before trying to run it
if [ ! -f "$TARGET_OUTPUT" ]; then
  echo "stdio-start.sh: ERROR - Target server file $TARGET_OUTPUT not found. Please build manually first (e.g., bun run build). Exiting." >&2
  exit 1
fi

echo "stdio-start.sh: Executing bun run $TARGET_OUTPUT ..." >&2
# Set required env var directly here for the bun run command
export USE_STDIO_TRANSPORT=true 
# Change directory to workspace root first, then execute with absolute path
cd "$WORKSPACE_ROOT" || exit 1 # Exit if cd fails
exec bun run "$TARGET_OUTPUT"

# This message should NOT appear if exec is successful
echo "stdio-start.sh: ERROR - exec command failed?" >&2
exit 1 # Exit with error if exec somehow fails/returns 