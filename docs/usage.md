# Usage Guide

This guide explains how to use the Home Assistant MCP Server for smart home device management and integration with language learning systems.

## Basic Usage

1. **Starting the Server:**
   - For development: run `npm run dev`.
   - For production: run `npm run build` followed by `npm start`.

2. **Accessing the Web Interface:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Real-Time Updates:**
   - Connect to the SSE endpoint at `/subscribe_events?token=YOUR_TOKEN&domain=light` to receive live updates.

## Advanced Features

1. **API Interactions:**
   - Use the REST API for operations such as device control, automation, and add-on management.
   - See [API Documentation](api.md) for details.

2. **Tool Integrations:**
   - Multiple tools are available (see [Tools Documentation](tools/tools.md)), for tasks like automation management and notifications.

3. **Security Settings:**
   - Configure token-based authentication and environment variables as per the [Configuration Guide](getting-started/configuration.md).

4. **Customization and Extensions:**
   - Extend server functionality by developing new tools as outlined in the [Development Guide](development/development.md).

## Troubleshooting

If you experience issues, review the [Troubleshooting Guide](troubleshooting.md). 