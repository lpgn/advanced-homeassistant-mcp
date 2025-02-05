#!/bin/bash

# macos-setup.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}Setting up MCP Integration for Claude Desktop${NC}"

# Error handling function
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

# Function to compare version numbers
version_greater_equal() {
    printf '%s\n' "$2" "$1" | sort -V -C
}

# Function to backup existing configuration
backup_config() {
    local backup_dir="$MCP_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    echo -e "${BLUE}Creating backup at: $backup_dir${NC}"
    
    mkdir -p "$backup_dir" || handle_error "Failed to create backup directory"
    
    # Backup existing configurations if they exist
    if [ -f "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" ]; then
        cp "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" "$backup_dir/" || handle_error "Failed to backup Claude config"
    fi
    
    if [ -f "$MCP_DIR/homeassistant-mcp/.env" ]; then
        cp "$MCP_DIR/homeassistant-mcp/.env" "$backup_dir/" || handle_error "Failed to backup .env file"
    fi
    
    echo -e "${GREEN}Backup created successfully${NC}"
    return 0
}

# Function to check for existing installation
check_existing_installation() {
    local has_existing=false
    local config_exists=false
    local repo_exists=false
    
    if [ -d "$MCP_DIR/homeassistant-mcp" ]; then
        repo_exists=true
    fi
    
    if [ -f "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" ] || [ -f "$MCP_DIR/homeassistant-mcp/.env" ]; then
        config_exists=true
    fi
    
    if $repo_exists || $config_exists; then
        echo -e "${YELLOW}Existing MCP installation detected${NC}"
        echo -e "Found:"
        $repo_exists && echo " - MCP repository at $MCP_DIR/homeassistant-mcp"
        [ -f "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" ] && echo " - Claude Desktop configuration"
        [ -f "$MCP_DIR/homeassistant-mcp/.env" ] && echo " - Environment configuration"
        
        while true; do
            echo -e "\nPlease choose an option:"
            echo "1) Upgrade existing installation (preserves configuration)"
            echo "2) Clean reinstall (backs up and replaces configuration)"
            echo "3) Exit"
            read -p "Enter your choice (1-3): " choice
            
            case $choice in
                1)
                    echo -e "${BLUE}Upgrading existing installation...${NC}"
                    backup_config
                    UPGRADE_MODE=true
                    break
                    ;;
                2)
                    echo -e "${BLUE}Performing clean reinstall...${NC}"
                    backup_config
                    
                    # Remove existing installation
                    if [ -d "$MCP_DIR/homeassistant-mcp" ]; then
                        rm -rf "$MCP_DIR/homeassistant-mcp" || handle_error "Failed to remove existing repository"
                    fi
                    if [ -f "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" ]; then
                        rm "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" || handle_error "Failed to remove existing Claude config"
                    fi
                    CLEAN_INSTALL=true
                    break
                    ;;
                3)
                    echo -e "${BLUE}Installation cancelled${NC}"
                    exit 0
                    ;;
                *)
                    echo -e "${RED}Invalid choice. Please enter 1, 2, or 3${NC}"
                    ;;
            esac
        done
    fi
}

# Create MCP directory if it doesn't exist
MCP_DIR="$HOME/.mcp"
mkdir -p "$MCP_DIR" || handle_error "Failed to create MCP directory"

# Create Claude Desktop config directory (macOS specific path)
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
mkdir -p "$CLAUDE_CONFIG_DIR" || handle_error "Failed to create Claude config directory"

# Initialize installation mode flags
UPGRADE_MODE=false
CLEAN_INSTALL=false

# Check for existing installation before proceeding
check_existing_installation

# Check system requirements
echo -e "${BLUE}Checking system requirements...${NC}"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Homebrew is not installed. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || handle_error "Failed to install Homebrew"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Installing via Homebrew...${NC}"
    brew install node@20 || handle_error "Failed to install Node.js"
    brew link node@20 || handle_error "Failed to link Node.js"
else
    NODE_VERSION=$(node -v)
    if ! version_greater_equal "${NODE_VERSION//v/}" "20.10.0"; then
        echo -e "${YELLOW}Node.js version must be 20.10.0 or higher. Current version: $NODE_VERSION${NC}"
        echo -e "${BLUE}Installing Node.js 20 via Homebrew...${NC}"
        brew install node@20 || handle_error "Failed to install Node.js"
        brew link node@20 || handle_error "Failed to link Node.js"
    fi
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    handle_error "npm is not installed. Please install npm and try again."
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}jq is not installed. Installing via Homebrew...${NC}"
    brew install jq || handle_error "Failed to install jq"
fi

# Check for required development tools
echo -e "${BLUE}Checking development dependencies...${NC}"
REQUIRED_TOOLS=("git" "curl" "typescript")
for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        case $tool in
            "typescript")
                echo -e "${YELLOW}TypeScript is not installed. Installing globally...${NC}"
                npm install -g typescript || handle_error "Failed to install TypeScript"
                ;;
            *)
                echo -e "${YELLOW}$tool is not installed. Installing via Homebrew...${NC}"
                brew install "$tool" || handle_error "Failed to install $tool"
                ;;
        esac
    fi
done

# Clone the Home Assistant MCP repository
echo -e "${BLUE}Cloning Home Assistant MCP repository...${NC}"
if [ -d "$MCP_DIR/homeassistant-mcp" ] && [ "$CLEAN_INSTALL" = false ]; then
    echo -e "${YELLOW}Repository exists. Updating...${NC}"
    cd "$MCP_DIR/homeassistant-mcp" || handle_error "Failed to change directory"
    git fetch origin || handle_error "Failed to fetch updates"
    git reset --hard origin/main || handle_error "Failed to reset to main branch"
    git clean -fd || handle_error "Failed to clean repository"
else
    if [ -d "$MCP_DIR/homeassistant-mcp" ]; then
        rm -rf "$MCP_DIR/homeassistant-mcp" || handle_error "Failed to remove existing repository"
    fi
    git clone https://github.com/jango-blockchained/homeassistant-mcp.git "$MCP_DIR/homeassistant-mcp" || handle_error "Failed to clone repository"
    cd "$MCP_DIR/homeassistant-mcp" || handle_error "Failed to change directory"
fi

# Install dependencies and build
echo -e "${BLUE}Installing dependencies and building...${NC}"
npm ci || handle_error "Failed to install npm dependencies"
npm run build || handle_error "Failed to build project"

# If upgrading, try to reuse existing configuration
if [ "$UPGRADE_MODE" = true ] && [ -f "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" ]; then
    echo -e "${BLUE}Reusing existing configuration...${NC}"
    # Extract existing values
    if [ -f "$MCP_DIR/homeassistant-mcp/.env" ]; then
        source "$MCP_DIR/homeassistant-mcp/.env"
        HASS_HOST=${HASS_HOST:-""}
        HASS_TOKEN=${HASS_TOKEN:-""}
        HASS_SOCKET_URL=${HASS_SOCKET_URL:-""}
    fi
    
    # If values are missing, prompt for them
    if [ -z "$HASS_HOST" ] || [ -z "$HASS_TOKEN" ]; then
        echo -e "${YELLOW}Some configuration values are missing. Please provide them:${NC}"
        # Get and validate Home Assistant URL
        while true; do
            read -p "Home Assistant URL (e.g., http://homeassistant.local:8123): " HASS_HOST
            if validate_url "$HASS_HOST"; then
                break
            fi
        done

        # Get and validate Home Assistant token
        while true; do
            read -p "Home Assistant Long-lived access token: " HASS_TOKEN
            if validate_token "$HASS_TOKEN"; then
                break
            fi
        done

        # Create WebSocket URL from HASS_HOST
        HASS_SOCKET_URL="${HASS_HOST/http/ws}/api/websocket"
    fi
else
    # Prompt for configurations with validation
    echo -e "${BLUE}Please enter your configurations:${NC}"

    # Function to validate URL
    validate_url() {
        if [[ ! "$1" =~ ^https?:// ]]; then
            handle_error "Invalid URL format. URL must start with http:// or https://"
        fi
    }

    # Function to validate token
    validate_token() {
        if [[ -z "$1" ]]; then
            handle_error "Token cannot be empty"
        fi
    }

    # Get and validate Home Assistant URL
    while true; do
        read -p "Home Assistant URL (e.g., http://homeassistant.local:8123): " HASS_HOST
        if validate_url "$HASS_HOST"; then
            break
        fi
    done

    # Get and validate Home Assistant token
    while true; do
        read -p "Home Assistant Long-lived access token: " HASS_TOKEN
        if validate_token "$HASS_TOKEN"; then
            break
        fi
    done

    # Create WebSocket URL from HASS_HOST
    HASS_SOCKET_URL="${HASS_HOST/http/ws}/api/websocket"

    # Create .env file for Home Assistant
    cat > "$MCP_DIR/homeassistant-mcp/.env" << EOL
NODE_ENV=production
HASS_HOST=$HASS_HOST
HASS_TOKEN=$HASS_TOKEN
HASS_SOCKET_URL=$HASS_SOCKET_URL
PORT=3000
DEBUG=false
EOL

    # Create base configuration for Home Assistant
    CONFIG_JSON='{
      "mcpServers": {
        "homeassistant": {
          "command": "node",
          "args": [
            "'$MCP_DIR'/homeassistant-mcp/dist/index.js"
          ],
          "env": {
            "HASS_TOKEN": "'$HASS_TOKEN'",
            "HASS_HOST": "'$HASS_HOST'",
            "HASS_SOCKET_URL": "'$HASS_SOCKET_URL'",
            "NODE_ENV": "production",
            "PORT": "3000",
            "DEBUG": "false"
          }
        }
      }
    }'

    # Write the final configuration to file
    echo $CONFIG_JSON | jq '.' > "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" || handle_error "Failed to write configuration file"

    # Set proper permissions
    chmod 600 "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" || handle_error "Failed to set permissions on config file"
    chmod 600 "$MCP_DIR/homeassistant-mcp/.env" || handle_error "Failed to set permissions on .env file"
fi

echo -e "${GREEN}Installation complete!${NC}"
if [ "$UPGRADE_MODE" = true ]; then
    echo -e "${BLUE}Upgraded existing installation${NC}"
elif [ "$CLEAN_INSTALL" = true ]; then
    echo -e "${BLUE}Performed clean installation${NC}"
    echo -e "${YELLOW}Your previous configuration has been backed up to: $MCP_DIR/backups/$(ls -t "$MCP_DIR/backups" | head -n1)${NC}"
fi
echo -e "${BLUE}Configuration files created at:${NC}"
echo " - $CLAUDE_CONFIG_DIR/claude_desktop_config.json"
echo " - $MCP_DIR/homeassistant-mcp/.env"
echo -e "${BLUE}To use the integration:${NC}"
echo "1. Make sure Claude Desktop is installed from https://claude.ai/download"
echo "2. Restart Claude Desktop"
echo "3. Home Assistant MCP integration is now available"
echo -e "${YELLOW}Note: Keep your access tokens and API keys secure and never share them with others${NC}"

# Optional: Test the installations
read -p "Would you like to test the installations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Testing Home Assistant MCP connection...${NC}"
    if ! node "$MCP_DIR/homeassistant-mcp/dist/index.js" test; then
        echo -e "${RED}Home Assistant MCP test failed. Please check your configuration and try again.${NC}"
    else
        echo -e "${GREEN}Home Assistant MCP test successful!${NC}"
    fi
fi

# macOS environment configuration
HASS_SOCKET_URL="${HASS_HOST/http/ws}/api/websocket" # WebSocket URL conversion
chmod 600 "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" # Security hardening 