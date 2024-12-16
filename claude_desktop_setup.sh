#!/bin/bash

# mcp-setup.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting up MCP Integration for Claude Desktop${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Installing via nvm...${NC}"
    
    # Install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install Node.js 20.10.0
    nvm install 20.10.0
    nvm use 20.10.0
else
    NODE_VERSION=$(node -v)
    if [[ ${NODE_VERSION//v/} < "20.10.0" ]]; then
        echo -e "${RED}Node.js version must be 20.10.0 or higher. Current version: $NODE_VERSION${NC}"
        exit 1
    fi
fi

# Install Brave Search MCP globally
echo -e "${BLUE}Installing Brave Search MCP...${NC}"
npm install -g @modelcontextprotocol/server-brave-search

# Create MCP directory if it doesn't exist
MCP_DIR="$HOME/.mcp"
mkdir -p "$MCP_DIR"

# Clone the Home Assistant MCP repository
echo -e "${BLUE}Cloning Home Assistant MCP repository...${NC}"
git clone https://github.com/jango-blockchained/homeassistant-mcp.git "$MCP_DIR/homeassistant-mcp"
cd "$MCP_DIR/homeassistant-mcp"

# Install dependencies and build
npm install
npm run build

# Prompt for configurations
echo -e "${BLUE}Please enter your configurations:${NC}"
read -p "Home Assistant URL (e.g., http://homeassistant.local:8123): " HASS_HOST
read -p "Home Assistant Long-lived access token: " HASS_TOKEN
read -p "Brave Search API Key: " BRAVE_API_KEY

# Create .env file for Home Assistant
cat > "$MCP_DIR/homeassistant-mcp/.env" << EOL
NODE_ENV=production
HASS_HOST=$HASS_HOST
HASS_TOKEN=$HASS_TOKEN
EOL

# Create Claude Desktop config directory
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
mkdir -p "$CLAUDE_CONFIG_DIR"

# Create combined configuration file
cat > "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" << EOL
{
  "mcpServers": {
    "homeassistant": {
      "command": "node",
      "args": [
        "$MCP_DIR/homeassistant-mcp/dist/index.js"
      ],
      "env": {
        "HASS_TOKEN": "$HASS_TOKEN",
        "HASS_HOST": "$HASS_HOST"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "$BRAVE_API_KEY"
      }
    }
  }
}
EOL

# Set proper permissions
chmod 600 "$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
chmod 600 "$MCP_DIR/homeassistant-mcp/.env"

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${BLUE}Configuration file created at:${NC} $CLAUDE_CONFIG_DIR/claude_desktop_config.json"
echo -e "${BLUE}To use the integration:${NC}"
echo "1. Make sure Claude Desktop is installed from https://claude.ai/download"
echo "2. Restart Claude Desktop"
echo "3. Both Home Assistant and Brave Search MCP integrations should now be available"
echo -e "${RED}Note: Keep your access tokens and API keys secure and never share them with others${NC}"

# Optional: Test the installations
read -p "Would you like to test the installations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${BLUE}Testing Home Assistant MCP connection...${NC}"
    node "$MCP_DIR/homeassistant-mcp/dist/index.js" test
    echo -e "${BLUE}Testing Brave Search MCP...${NC}"
    npx @modelcontextprotocol/server-brave-search test
fi