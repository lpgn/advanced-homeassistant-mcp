#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        return 0
    else
        return 1
    fi
}

# Function to copy environment file
copy_env_file() {
    local source=$1
    local target=$2
    if [ -f "$target" ]; then
        print_message "$YELLOW" "Warning: $target already exists. Skipping..."
    else
        cp "$source" "$target"
        if [ $? -eq 0 ]; then
            print_message "$GREEN" "Created $target successfully"
        else
            print_message "$RED" "Error: Failed to create $target"
            exit 1
        fi
    fi
}

# Main script
print_message "$GREEN" "Setting up environment files..."

# Check if .env.example exists
if ! check_file ".env.example"; then
    print_message "$RED" "Error: .env.example not found!"
    exit 1
fi

# Setup base environment file
if [ "$1" = "--force" ]; then
    cp .env.example .env
    print_message "$GREEN" "Forced creation of .env file"
else
    copy_env_file ".env.example" ".env"
fi

# Determine environment
ENV=${NODE_ENV:-development}
case "$ENV" in
    "development"|"dev")
        ENV_FILE=".env.dev"
        ;;
    "production"|"prod")
        ENV_FILE=".env.prod"
        ;;
    "test")
        ENV_FILE=".env.test"
        ;;
    *)
        print_message "$RED" "Error: Invalid environment: $ENV"
        exit 1
        ;;
esac

# Copy environment-specific file
if [ -f "$ENV_FILE" ]; then
    if [ "$1" = "--force" ]; then
        cp "$ENV_FILE" .env
        print_message "$GREEN" "Forced override of .env with $ENV_FILE"
    else
        print_message "$YELLOW" "Do you want to override .env with $ENV_FILE? [y/N] "
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
            cp "$ENV_FILE" .env
            print_message "$GREEN" "Copied $ENV_FILE to .env"
        else
            print_message "$YELLOW" "Keeping existing .env file"
        fi
    fi
else
    print_message "$YELLOW" "Warning: $ENV_FILE not found. Using default .env"
fi

print_message "$GREEN" "Environment setup complete!"
print_message "$YELLOW" "Remember to set your HASS_TOKEN in .env" 