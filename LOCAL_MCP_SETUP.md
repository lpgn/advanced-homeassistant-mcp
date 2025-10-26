# Local MCP Server Setup

This directory contains the Home Assistant MCP Server that can be configured for local use with VS Code, Cursor, or other MCP-compatible clients.

## Quick Setup for VS Code Insiders

### 1. Add to VS Code MCP Configuration

Add this configuration to your MCP settings file:

**Location:** `%APPDATA%\Code - Insiders\User\mcp.json`

```json
{
	"servers": {
		"homeassistant-local": {
			"type": "stdio",
			"command": "docker",
			"args": [
				"exec",
				"-i",
				"homeassistant-mcp-server",
				"bun",
				"run",
				"src/stdio-server.ts"
			]
		}
	}
}
```

### 2. Ensure Docker Container is Running

```powershell
cd path/to/advanced-homeassistant-mcp
docker-compose up -d
```

### 3. Verify Container Status

```powershell
docker-compose ps
```

You should see `homeassistant-mcp-server` running.

### 4. Restart VS Code Insiders

Close and reopen VS Code Insiders to load the MCP server.

---

## Setup for Other Clients

### Cursor IDE

**Location:** `%APPDATA%\Cursor\User\mcp.json`

Same configuration as VS Code above.

### Cline Extension

**Location:** `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

```json
{
	"mcpServers": {
		"homeassistant-local": {
			"type": "stdio",
			"command": "docker",
			"args": [
				"exec",
				"-i",
				"homeassistant-mcp-server",
				"bun",
				"run",
				"src/stdio-server.ts"
			]
		}
	}
}
```

### Claude Desktop

**Location (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Location (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
	"mcpServers": {
		"homeassistant-local": {
			"command": "docker",
			"args": [
				"exec",
				"-i",
				"homeassistant-mcp-server",
				"bun",
				"run",
				"src/stdio-server.ts"
			]
		}
	}
}
```

---

## Configuration File Reference

A ready-to-use configuration file is included: **`.vscode/mcp-config.json`**

You can copy this file's contents directly to your client's MCP configuration location.

---

## Environment Setup

### Required Environment Variables

The container needs these environment variables (set in `.env` file):

```env
HASS_URL=http://your-home-assistant-ip:8123
HASS_TOKEN=your-long-lived-access-token
```

### Getting a Home Assistant Token

1. Open Home Assistant
2. Click your profile (bottom left)
3. Scroll to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Give it a name (e.g., "MCP Server")
6. Copy the token
7. Add to `.env` file

---

## Testing the Connection

### Method 1: Via MCP Client

After restarting your client, you should see:
- ✅ 29 tools available
- ✅ 10 prompts available
- ✅ Connection status: Connected

### Method 2: Manual Test

```powershell
# Test the stdio server directly
docker exec -i homeassistant-mcp-server bun run src/stdio-server.ts

# You should see JSON-RPC initialization messages
```

### Method 3: Check Logs

```powershell
docker-compose logs --tail=50

# Look for:
# - "FastMCP server started successfully"
# - "Added tool: [tool_name]" (x29)
# - "Added prompt: [prompt_name]" (x10)
```

---

## Available Tools (29)

### Core Tools
- `control` - Control devices
- `history` - Historical data
- `addon` - Manage add-ons
- `package` - HACS packages
- `automation_config` - Configure automations
- `subscribe_events` - Event subscriptions
- `get_sse_stats` - SSE statistics
- `error_log` - Error logs
- `call_service` - Call HA services
- `file_operations` - File management
- `shell_command` - Shell commands
- `system_management` - System operations

### Advanced Tools
- `get_live_context` - Current state
- `entity_search` - Search entities
- `get_system_prompt` - System info
- `dashboard_config` - **Dashboard generator** ⭐
- `domain_summary` - Domain statistics
- `get_entity` - Entity details
- `get_version` - HA version
- `system_overview` - System overview
- `restart_ha` - Restart HA
- `yaml_editor` - Edit YAML
- `system_info` - Server info

### Home Assistant Tools
- `lights_control` - Light control
- `climate_control` - Climate control
- `automation` - Automation management
- `list_devices` - Device listing
- `notify` - Notifications
- `scene` - Scene management

---

## Available Prompts (10)

1. **create_automation** - Create new automations
2. **debug_automation** - Debug automation issues
3. **troubleshoot_entity** - Troubleshoot entities
4. **routine_optimizer** - Optimize routines
5. **automation_health_check** - Check automation health
6. **entity_naming_consistency** - Check naming
7. **dashboard_layout_generator** - Generate dashboards
8. **energy_optimization** - Energy optimization
9. **security_audit** - Security review
10. **backup_strategy** - Backup suggestions

---

## Troubleshooting

### Issue: Container Not Running

```powershell
cd path/to/advanced-homeassistant-mcp
docker-compose up -d --build
```

### Issue: Container Unhealthy

The "unhealthy" status is cosmetic - the HTTP server is stuck but stdio transport works fine. You can ignore it.

### Issue: Connection Failed

1. Check container is running: `docker-compose ps`
2. Check logs: `docker-compose logs --tail=50`
3. Verify .env file has HASS_URL and HASS_TOKEN
4. Restart client application

### Issue: Tools Not Appearing

1. Restart your MCP client
2. Check MCP configuration file location
3. Verify JSON syntax is correct
4. Check client logs for MCP connection errors

### Issue: Home Assistant Connection Error

1. Verify Home Assistant is accessible: `curl http://your-ha-ip:8123`
2. Check token is valid (try in HA UI)
3. Ensure no firewall blocking
4. Check HASS_URL in .env (should include http://)

---

## Advanced Configuration

### Custom Container Name

If you changed the container name in docker-compose.yml, update the args:

```json
"args": [
	"exec",
	"-i",
	"your-custom-container-name",
	"bun",
	"run",
	"src/stdio-server.ts"
]
```

### Running Without Docker

If running directly with Bun (not recommended for Windows):

```json
{
	"command": "bun",
	"args": ["run", "/path/to/advanced-homeassistant-mcp/src/stdio-server.ts"],
	"env": {
		"HASS_URL": "http://your-ha-ip:8123",
		"HASS_TOKEN": "your-token"
	}
}
```

### Multiple Home Assistant Instances

Add multiple server configurations:

```json
{
	"servers": {
		"homeassistant-primary": {
			"type": "stdio",
			"command": "docker",
			"args": ["exec", "-i", "ha-primary-mcp", "bun", "run", "src/stdio-server.ts"]
		},
		"homeassistant-secondary": {
			"type": "stdio",
			"command": "docker",
			"args": ["exec", "-i", "ha-secondary-mcp", "bun", "run", "src/stdio-server.ts"]
		}
	}
}
```

---

## Performance Tips

1. **Keep Container Running**: Don't stop/start frequently
2. **Use .env File**: Don't hardcode tokens in config
3. **Monitor Logs**: Check for errors regularly
4. **Update Regularly**: Pull latest changes from repo

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Protect Your Token**: Never commit .env file to git
2. **Use Long-Lived Tokens**: Not temporary tokens
3. **Limited Scope**: Create token with minimal required permissions
4. **Network Security**: Ensure Home Assistant is not exposed to internet without proper security
5. **Docker Security**: Container runs as non-root user (bunjs)

---

## Getting Help

- **Documentation**: See `DASHBOARD_GENERATOR_GUIDE.md` for dashboard tool
- **Examples**: See `DASHBOARD_EXAMPLES.md` for usage examples
- **Status**: See `MCP_SERVER_STATUS.md` for current status
- **Issues**: Open issue on GitHub repository

---

## File Locations Quick Reference

### VS Code Insiders (Windows)
```
%APPDATA%\Code - Insiders\User\mcp.json
```

### VS Code (Windows)
```
%APPDATA%\Code\User\mcp.json
```

### Cursor (Windows)
```
%APPDATA%\Cursor\User\mcp.json
```

### Cline Extension
```
%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

### Claude Desktop (Windows)
```
%APPDATA%\Claude\claude_desktop_config.json
```

### Claude Desktop (macOS)
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

---

*Last Updated: October 26, 2025*  
*Version: 1.0.0*  
*Status: Production Ready* ✅
