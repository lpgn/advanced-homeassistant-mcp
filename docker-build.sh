#!/bin/bash

# Enable error handling
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to clean up on script exit
cleanup() {
    print_message "$YELLOW" "Cleaning up..."
    docker builder prune -f --filter until=24h
    docker image prune -f
}
trap cleanup EXIT

# Parse command line arguments
ENABLE_SPEECH=false
ENABLE_GPU=false
BUILD_TYPE="standard"

while [[ $# -gt 0 ]]; do
    case $1 in
        --speech)
            ENABLE_SPEECH=true
            BUILD_TYPE="speech"
            shift
            ;;
        --gpu)
            ENABLE_GPU=true
            shift
            ;;
        *)
            print_message "$RED" "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Clean up Docker system
print_message "$YELLOW" "Cleaning up Docker system..."
docker system prune -f --volumes

# Set build arguments for better performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export BUILDKIT_PROGRESS=plain

# Calculate available memory and CPU
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
BUILD_MEM=$(( TOTAL_MEM / 2 ))  # Use half of available memory
CPU_COUNT=$(nproc)
CPU_QUOTA=$(( CPU_COUNT * 50000 ))  # Allow 50% CPU usage per core

print_message "$YELLOW" "Building with ${BUILD_MEM}MB memory limit and CPU quota ${CPU_QUOTA}"

# Remove any existing lockfile
rm -f bun.lockb

# Base build arguments
BUILD_ARGS=(
    --memory="${BUILD_MEM}m"
    --memory-swap="${BUILD_MEM}m"
    --cpu-quota="${CPU_QUOTA}"
    --build-arg BUILDKIT_INLINE_CACHE=1
    --build-arg DOCKER_BUILDKIT=1
    --build-arg NODE_ENV=production
    --progress=plain
    --no-cache
    --compress
)

# Add speech-specific build arguments if enabled
if [ "$ENABLE_SPEECH" = true ]; then
    BUILD_ARGS+=(
        --build-arg ENABLE_SPEECH_FEATURES=true
        --build-arg ENABLE_WAKE_WORD=true
        --build-arg ENABLE_SPEECH_TO_TEXT=true
    )
    
    # Add GPU support if requested
    if [ "$ENABLE_GPU" = true ]; then
        BUILD_ARGS+=(
            --build-arg CUDA_VISIBLE_DEVICES=0
            --build-arg COMPUTE_TYPE=float16
        )
    fi
fi

# Build the images
print_message "$YELLOW" "Building Docker image (${BUILD_TYPE} build)..."

# Build main image
DOCKER_BUILDKIT=1 docker build \
    "${BUILD_ARGS[@]}" \
    -t homeassistant-mcp:latest \
    -t homeassistant-mcp:$(date +%Y%m%d) \
    .

# Check if build was successful
BUILD_EXIT_CODE=$?
if [ $BUILD_EXIT_CODE -eq 124 ]; then
    print_message "$RED" "Build timed out after 15 minutes!"
    exit 1
elif [ $BUILD_EXIT_CODE -ne 0 ]; then
    print_message "$RED" "Build failed with exit code ${BUILD_EXIT_CODE}!"
    exit 1
else
    print_message "$GREEN" "Main image build completed successfully!"
    
    # Show image size and layers
    docker image ls homeassistant-mcp:latest --format "Image size: {{.Size}}"
    echo "Layer count: $(docker history homeassistant-mcp:latest | wc -l)"
fi

# Build speech-related images if enabled
if [ "$ENABLE_SPEECH" = true ]; then
    print_message "$YELLOW" "Building speech-related images..."
    
    # Build fast-whisper image
    print_message "$YELLOW" "Building fast-whisper image..."
    docker pull onerahmet/openai-whisper-asr-webservice:latest
    
    # Build wake-word image
    print_message "$YELLOW" "Building wake-word image..."
    docker pull rhasspy/wyoming-openwakeword:latest
    
    print_message "$GREEN" "Speech-related images built successfully!"
fi

print_message "$GREEN" "All builds completed successfully!"

# Show final status
print_message "$YELLOW" "Build Summary:"
echo "Build Type: $BUILD_TYPE"
echo "Speech Features: $([ "$ENABLE_SPEECH" = true ] && echo 'Enabled' || echo 'Disabled')"
echo "GPU Support: $([ "$ENABLE_GPU" = true ] && echo 'Enabled' || echo 'Disabled')"
docker image ls | grep -E 'homeassistant-mcp|whisper|openwakeword' 