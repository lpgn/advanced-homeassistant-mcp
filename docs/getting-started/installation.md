# Installation Guide

## Prerequisites

### System Requirements
- **Operating System:** Linux, macOS, or Windows (Docker recommended)
- **Runtime:** Bun v1.0.26 or higher
- **Home Assistant:** v2023.11 or higher
- **Minimum Hardware:**
  - 2 CPU cores
  - 2GB RAM
  - 10GB free disk space

### Software Dependencies
- Bun runtime
- Docker (optional, recommended for deployment)
- Git
- Node.js (for some development tasks)

## Installation Methods

### 1. Basic Setup

#### Install Bun
```bash
curl -fsSL https://bun.sh/install | bash
```

#### Clone Repository
```bash
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp
```

#### Install Dependencies
```bash
bun install
```

#### Configure Environment
1. Copy environment template
```bash
cp .env.example .env
```
2. Edit `.env` file with your Home Assistant configuration
   - Set `HASS_HOST`
   - Configure authentication tokens
   - Adjust other settings as needed

#### Build and Start
```bash
bun run build
bun start
```

### 2. Docker Setup (Recommended)

#### Prerequisites
- Docker
- Docker Compose

#### Deployment Steps
```bash
# Clone repository
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp

# Configure environment
cp .env.example .env
# Edit .env file with your settings

# Deploy with Docker Compose
docker compose up -d
```

### 3. Home Assistant Add-on (Coming Soon)
We're working on a direct Home Assistant add-on for even easier installation.

## Verification

### Check Installation
- Web Interface: [http://localhost:3000](http://localhost:3000)
- Logs: `docker compose logs` or check `logs/` directory

### Troubleshooting
- Ensure all environment variables are correctly set
- Check network connectivity to Home Assistant
- Verify authentication tokens

## Updating

### Basic Setup
```bash
git pull
bun install
bun run build
bun start
```

### Docker
```bash
git pull
docker compose up -d --build
```

## Uninstallation

### Basic Setup
```bash
cd homeassistant-mcp
bun stop  # Stop the application
rm -rf node_modules dist
```

### Docker
```bash
docker compose down
docker rmi homeassistant-mcp  # Remove image
```

## Next Steps
- [Configuration Guide](configuration.md)
- [Usage Instructions](../usage.md)
- [Troubleshooting](../troubleshooting.md) 