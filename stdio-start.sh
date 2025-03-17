#!/bin/bash

# MCP Server Stdio Transport Launcher
# This script builds and runs the MCP server using stdin/stdout JSON-RPC 2.0 transport

# ANSI colors for prettier output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Show usage information
function show_usage {
  echo -e "${BLUE}Usage:${NC} $0 [options]"
  echo 
  echo "Options:"
  echo "  --debug        Enable debug mode"
  echo "  --rebuild      Force rebuild even if dist exists"
  echo "  --help         Show this help message"
  echo
  echo "Examples:"
  echo "  $0                 # Normal start"
  echo "  $0 --debug         # Start with debug logging" 
  echo "  $0 --rebuild       # Force rebuild"
  echo
  echo "This script runs the MCP server with JSON-RPC 2.0 stdio transport."
  echo "Logs will be written to the logs directory but not to stdout."
  echo
}

# Process command line arguments
REBUILD=false
DEBUG=false

for arg in "$@"; do
  case $arg in
    --help)
      show_usage
      exit 0
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    --rebuild)
      REBUILD=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option:${NC} $arg"
      show_usage
      exit 1
      ;;
  esac
done

# Check for errors
if [ ! -f ".env" ]; then
  echo -e "${RED}Error:${NC} .env file not found. Please create one from .env.example." >&2
  exit 1
fi

# Set environment variables
export USE_STDIO_TRANSPORT=true

# Set debug mode if requested
if [ "$DEBUG" = true ]; then
  export DEBUG=true
  echo -e "${YELLOW}Debug mode enabled${NC}" >&2
fi

# Check if we need to build
if [ ! -d "dist" ] || [ "$REBUILD" = true ]; then
  echo -e "${BLUE}Building MCP server with stdio transport...${NC}" >&2
  bun build ./src/index.ts --outdir ./dist --target bun || {
    echo -e "${RED}Build failed!${NC}" >&2
    exit 1
  }
else
  echo -e "${GREEN}Using existing build in dist/ directory${NC}" >&2
  echo -e "${YELLOW}Use --rebuild flag to force a rebuild${NC}" >&2
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the application with stdio transport
echo -e "${GREEN}Starting MCP server with stdio transport...${NC}" >&2
echo -e "${YELLOW}Note: All logs will be written to logs/ directory${NC}" >&2
echo -e "${YELLOW}Press Ctrl+C to stop${NC}" >&2

# Execute the server
exec bun run dist/index.js

# The exec replaces this shell with the server process
# so any code after this point will not be executed 