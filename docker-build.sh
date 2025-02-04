#!/bin/bash

# Enable error handling
set -euo pipefail

# Function to clean up on script exit
cleanup() {
    echo "Cleaning up..."
    docker builder prune -f --filter until=24h
    docker image prune -f
}
trap cleanup EXIT

# Clean up Docker system
echo "Cleaning up Docker system..."
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

echo "Building with ${BUILD_MEM}MB memory limit and CPU quota ${CPU_QUOTA}"

# Build with resource limits, optimizations, and timeout
echo "Building Docker image..."
timeout 15m docker build \
    --memory="${BUILD_MEM}m" \
    --memory-swap="${BUILD_MEM}m" \
    --cpu-quota="${CPU_QUOTA}" \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --build-arg DOCKER_BUILDKIT=1 \
    --build-arg NODE_ENV=production \
    --progress=plain \
    --no-cache \
    --compress \
    -t homeassistant-mcp:latest \
    -t homeassistant-mcp:$(date +%Y%m%d) \
    .

# Check if build was successful
BUILD_EXIT_CODE=$?
if [ $BUILD_EXIT_CODE -eq 124 ]; then
    echo "Build timed out after 15 minutes!"
    exit 1
elif [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "Build failed with exit code ${BUILD_EXIT_CODE}!"
    exit 1
else
    echo "Build completed successfully!"
    
    # Show image size and layers
    docker image ls homeassistant-mcp:latest --format "Image size: {{.Size}}"
    echo "Layer count: $(docker history homeassistant-mcp:latest | wc -l)"
fi 