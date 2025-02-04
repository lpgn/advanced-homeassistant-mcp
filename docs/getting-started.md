# Getting Started with Home Assistant MCP

This guide will help you get started with the Home Assistant MCP (Model Context Protocol).

## Prerequisites

Before you begin, ensure you have:

1. Node.js (v16 or higher)
2. A running Home Assistant instance
3. A Home Assistant Long-Lived Access Token

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/homeassistant-mcp.git
   cd homeassistant-mcp
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   BUN_ENV=development

   # Home Assistant Configuration
   HASS_HOST=http://your-hass-instance:8123
   HASS_TOKEN=your-long-lived-access-token

   # Security Configuration
   JWT_SECRET=your-secret-key
   ```

## Configuration

### Environment Variables

- `PORT`: The port number for the MCP server (default: 3000)
- `BUN_ENV`: The environment mode (development, production, test)
- `HASS_HOST`: Your Home Assistant instance URL
- `HASS_TOKEN`: Your Home Assistant Long-Lived Access Token
- `JWT_SECRET`: Secret key for JWT token generation

### Development Mode

For development, you can use:

```bash
bun run dev
```

This will start the server in development mode with hot reloading.

### Production Mode

For production, build and start the server:

```bash
bun run build
bun start
```

## First Steps

1. Check the server is running:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. List available devices:
   ```bash
   curl -H "Authorization: Bearer your-token" http://localhost:3000/api/tools/devices
   ```

3. Subscribe to events:
   ```bash
   curl -H "Authorization: Bearer your-token" http://localhost:3000/api/sse/subscribe?events=state_changed
   ```

## Next Steps

- Read the [API Documentation](./API.md) for available endpoints
- Learn about [Server-Sent Events](./SSE_API.md) for real-time updates
- Explore available [Tools](./tools/README.md) for device control
- Check the [Configuration Guide](./configuration/README.md) for advanced settings

## Troubleshooting

If you encounter issues:

1. Verify your Home Assistant instance is accessible
2. Check your environment variables are correctly set
3. Look for errors in the server logs
4. Consult the [Troubleshooting Guide](./troubleshooting.md)

## Development

For development and contributing:

1. Fork the repository
2. Create a feature branch
3. Follow the [Development Guide](./development/README.md)
4. Submit a pull request

## Support

Need help? Check out:

- [GitHub Issues](https://github.com/yourusername/homeassistant-mcp/issues)
- [Troubleshooting Guide](./troubleshooting.md)
- [FAQ](./troubleshooting.md#faq) 