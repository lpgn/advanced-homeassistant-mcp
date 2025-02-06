---
layout: default
title: Docker Deployment
parent: Getting Started
nav_order: 3
---

# Docker Setup Guide 🐳

## Overview

I've designed the MCP server to run efficiently in Docker containers, with support for different configurations including speech processing and GPU acceleration.

## Build Options 🛠️

### 1. Standard Build
```bash
./docker-build.sh
```

This build includes:
- Core MCP server functionality
- REST API endpoints
- WebSocket/SSE support
- Basic automation features

Resource usage:
- Memory: 50% of available RAM
- CPU: 50% per core
- Disk: ~200MB

### 2. Speech-Enabled Build
```bash
./docker-build.sh --speech
```

Additional features:
- Wake word detection
- Speech-to-text processing
- Multiple language support

Required images:
```bash
onerahmet/openai-whisper-asr-webservice:latest  # Speech-to-text
rhasspy/wyoming-openwakeword:latest             # Wake word detection
```

Resource requirements:
- Memory: 2GB minimum
- CPU: 2 cores minimum
- Disk: ~2GB

### 3. GPU-Accelerated Build
```bash
./docker-build.sh --speech --gpu
```

Enhanced features:
- CUDA GPU acceleration
- Float16 compute type
- Optimized performance
- Faster speech processing

Requirements:
- NVIDIA GPU
- CUDA drivers
- nvidia-docker runtime

## Docker Compose Files 📄

### 1. Base Configuration (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  homeassistant-mcp:
    build: .
    ports:
      - "${HOST_PORT:-4000}:4000"
    env_file:
      - .env
      - .env.${NODE_ENV:-development}
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - PORT=4000
      - HASS_HOST
      - HASS_TOKEN
      - LOG_LEVEL=${LOG_LEVEL:-info}
    volumes:
      - .:/app
      - /app/node_modules
      - logs:/app/logs
```

### 2. Speech Support (`docker-compose.speech.yml`)
```yaml
services:
  homeassistant-mcp:
    environment:
      - ENABLE_SPEECH_FEATURES=true
      - ENABLE_WAKE_WORD=true
      - ENABLE_SPEECH_TO_TEXT=true

  fast-whisper:
    image: onerahmet/openai-whisper-asr-webservice:latest
    volumes:
      - whisper-models:/models
      - audio-data:/audio

  wake-word:
    image: rhasspy/wyoming-openwakeword:latest
    devices:
      - /dev/snd:/dev/snd
```

## Launch Commands 🚀

### Standard Launch
```bash
# Build and start
./docker-build.sh
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### With Speech Features
```bash
# Build with speech support
./docker-build.sh --speech

# Start all services
docker compose -f docker-compose.yml -f docker-compose.speech.yml up -d

# View specific service logs
docker compose logs -f fast-whisper
docker compose logs -f wake-word
```

### With GPU Support
```bash
# Build with GPU acceleration
./docker-build.sh --speech --gpu

# Start with GPU support
docker compose -f docker-compose.yml -f docker-compose.speech.yml \
  --env-file .env.gpu up -d
```

## Resource Management 📊

The build script automatically manages resources:

1. **Memory Allocation**
   ```bash
   TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
   BUILD_MEM=$(( TOTAL_MEM / 2 ))
   ```

2. **CPU Management**
   ```bash
   CPU_COUNT=$(nproc)
   CPU_QUOTA=$(( CPU_COUNT * 50000 ))
   ```

3. **Build Arguments**
   ```bash
   BUILD_ARGS=(
       --memory="${BUILD_MEM}m"
       --memory-swap="${BUILD_MEM}m"
       --cpu-quota="${CPU_QUOTA}"
   )
   ```

## Troubleshooting 🔧

### Common Issues

1. **Build Failures**
   - Check system resources
   - Verify Docker daemon is running
   - Ensure network connectivity
   - Review build logs

2. **Speech Processing Issues**
   - Verify audio device permissions
   - Check CUDA installation (for GPU)
   - Monitor resource usage
   - Review service logs

3. **Performance Problems**
   - Adjust resource limits
   - Consider GPU acceleration
   - Monitor container stats
   - Check for resource conflicts

### Debug Commands
```bash
# Check container status
docker compose ps

# View resource usage
docker stats

# Check logs
docker compose logs --tail=100

# Inspect configuration
docker compose config
```

## Best Practices 🎯

1. **Resource Management**
   - Monitor container resources
   - Set appropriate limits
   - Use GPU when available
   - Regular cleanup

2. **Security**
   - Use non-root users
   - Limit container capabilities
   - Regular security updates
   - Proper secret management

3. **Maintenance**
   - Regular image updates
   - Log rotation
   - Resource cleanup
   - Performance monitoring

## Advanced Configuration ⚙️

### Custom Build Arguments
```bash
# Example: Custom memory limits
BUILD_MEM=4096 ./docker-build.sh --speech

# Example: Specific CUDA device
CUDA_VISIBLE_DEVICES=1 ./docker-build.sh --speech --gpu
```

### Environment Overrides
```bash
# Production settings
NODE_ENV=production ./docker-build.sh

# Custom port
HOST_PORT=5000 docker compose up -d
```

See [Configuration Guide](../configuration.md) for more environment options. 