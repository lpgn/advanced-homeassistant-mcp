# 🔓 UNRESTRICTED ACCESS MODE

## ⚠️ CRITICAL SECURITY WARNING

This MCP server has **COMPLETE, UNRESTRICTED ACCESS** to your Home Assistant installation. It can:

- 🔥 **Execute ANY service** without restrictions
- 📝 **Read, write, and delete ANY file** on the system
- 🖥️ **Execute shell commands** on the Home Assistant host
- 🔄 **Restart or stop Home Assistant**
- ⚙️ **Modify all configurations** including automations, scripts, and core settings
- 🗑️ **Delete entities and integrations**
- 📂 **Access the entire filesystem** within Home Assistant's permissions

## 🛡️ Security Implications

### What This Means:
- **NO SAFETY GUARDS**: There are no restrictions on what operations can be performed
- **NO VALIDATION**: Commands are passed directly to Home Assistant
- **NO UNDO**: Operations are permanent and immediate
- **FULL ADMIN**: Equivalent to having root access to your Home Assistant instance

### Potential Risks:
1. **Data Loss**: Files can be accidentally deleted or overwritten
2. **System Instability**: Invalid configurations can break Home Assistant
3. **Security Breach**: Exposed credentials or tokens could compromise your system
4. **Service Disruption**: Critical services can be stopped or misconfigured
5. **Privacy Violation**: All data is accessible without authentication

## 🔒 Recommended Security Measures

### 1. Network Security
```yaml
# Restrict access to trusted networks only
# In your Home Assistant configuration:
http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 127.0.0.1
    - ::1
  ip_ban_enabled: true
  login_attempts_threshold: 3
```

### 2. Token Security
- Use a dedicated **long-lived access token** with admin rights
- Store the token in environment variables, never in code
- Rotate tokens regularly
- Monitor token usage in Home Assistant logs

### 3. MCP Server Security
```bash
# Set restrictive file permissions
chmod 600 .env
chmod 700 src/tools/file-operations.tool.ts
chmod 700 src/tools/shell-command.tool.ts
chmod 700 src/tools/system-management.tool.ts

# Run with minimal privileges
# Use Docker with appropriate security context
```

### 4. Monitoring & Logging
```yaml
# Enable comprehensive logging in Home Assistant
logger:
  default: info
  logs:
    homeassistant.core: debug
    homeassistant.components.api: debug
    homeassistant.components.http: debug
```

### 5. Backup Strategy
**CRITICAL**: Always maintain backups before using unrestricted tools

```bash
# Automated backup before dangerous operations
ha backups new --name "pre-mcp-$(date +%Y%m%d-%H%M%S)"
```

## 🛠️ Unrestricted Tools

### 1. `call_service` - Generic Service Caller
**Capability**: Call ANY Home Assistant service
```json
{
  "tool": "call_service",
  "params": {
    "domain": "homeassistant",
    "service": "restart",
    "service_data": {}
  }
}
```

**Examples**:
- Restart HA: `homeassistant.restart`
- Stop HA: `homeassistant.stop`
- Execute shell: `shell_command.*`
- Modify any entity state
- Call any integration service

---

### 2. `file_operations` - File System Access
**Capability**: Read, write, delete, list any file
```json
{
  "tool": "file_operations",
  "params": {
    "operation": "write",
    "path": "configuration.yaml",
    "content": "# Modified config\nhomeassistant:\n  name: Home"
  }
}
```

**Operations**:
- `read`: Read file contents
- `write`: Create or overwrite files
- `delete`: Delete files permanently
- `list`: List directory contents
- `exists`: Check if file exists

**Dangerous Paths**:
- `configuration.yaml` - Core HA config
- `secrets.yaml` - Sensitive credentials
- `automations.yaml` - Automation definitions
- `.storage/` - HA internal state
- `custom_components/` - Custom integrations

---

### 3. `shell_command` - Shell Execution
**Capability**: Execute arbitrary shell commands
```json
{
  "tool": "shell_command",
  "params": {
    "command": "ls -la /config",
    "timeout": 30
  }
}
```

**Examples**:
```bash
# System information
"uname -a"
"df -h"
"ps aux"

# File operations
"cat /config/secrets.yaml"
"rm -rf /config/custom_components/*"

# Network operations
"curl https://api.example.com"
"ping -c 4 8.8.8.8"

# Package management (if available)
"apk add curl"
"pip install requests"
```

⚠️ **Note**: Shell command execution may require the `shell_command` integration or SSH add-on

---

### 4. `system_management` - System Operations
**Capability**: Control Home Assistant system
```json
{
  "tool": "system_management",
  "params": {
    "action": "restart"
  }
}
```

**Actions**:
- `restart` - Restart Home Assistant
- `stop` - Stop Home Assistant
- `reload_core_config` - Reload core configuration
- `reload_all` - Reload all YAML configs
- `reload_automation` - Reload automations
- `reload_script` - Reload scripts
- `reload_scene` - Reload scenes
- `reload_group` - Reload groups
- `reload_template` - Reload templates
- `check_config` - Validate configuration
- `set_location` - Change HA location
- `update_entity` - Modify entity properties
- `remove_entity` - Delete entities

---

### 5. `get_error_log` - Log Access
**Capability**: Read Home Assistant error logs
```json
{
  "tool": "get_error_log",
  "params": {
    "lines": 100,
    "filter": "error"
  }
}
```

---

### 6. `get_history` - Historical Data
**Capability**: Access all historical state data
```json
{
  "tool": "get_history",
  "params": {
    "entity_id": "sensor.temperature",
    "start_time": "2024-01-01T00:00:00Z"
  }
}
```

---

### 7. `automation_config` - Automation Management
**Capability**: Create, modify, delete automations
```json
{
  "tool": "automation_config",
  "params": {
    "action": "create",
    "config": {
      "alias": "New Automation",
      "trigger": [...],
      "action": [...]
    }
  }
}
```

## 📋 Usage Examples

### Example 1: Read Configuration File
```json
{
  "tool": "file_operations",
  "params": {
    "operation": "read",
    "path": "configuration.yaml",
    "encoding": "utf-8"
  }
}
```

### Example 2: Modify Automation
```json
{
  "tool": "file_operations",
  "params": {
    "operation": "write",
    "path": "automations.yaml",
    "content": "- id: '1234'\n  alias: Test\n  trigger:\n    - platform: state\n  action:\n    - service: light.turn_on"
  }
}
```

### Example 3: Restart Home Assistant
```json
{
  "tool": "system_management",
  "params": {
    "action": "restart"
  }
}
```

### Example 4: Execute Shell Command
```json
{
  "tool": "shell_command",
  "params": {
    "command": "ha core check",
    "timeout": 60
  }
}
```

## 🚫 What NOT To Do

### ❌ Never:
1. Expose this server to the public internet
2. Use it in production without extensive testing
3. Share your access token
4. Execute untrusted commands
5. Delete files without backups
6. Modify core files without understanding them
7. Run this on a system with critical automations

### ❌ Dangerous Operations:
```bash
# DO NOT run these commands without backup:
rm -rf /config/*
rm /config/configuration.yaml
chmod 000 /config/*
killall python3
```

## ✅ Best Practices

### 1. Testing Workflow
```bash
# 1. Create backup
ha backups new --name "before-test"

# 2. Test in non-production environment
docker compose up homeassistant-test

# 3. Validate changes
ha core check

# 4. Apply to production
ha core restart
```

### 2. Configuration Management
```yaml
# Use version control for all configs
git init /config
git add configuration.yaml automations.yaml
git commit -m "Backup before MCP changes"
```

### 3. Monitoring
```bash
# Watch logs in real-time
ha core logs --follow

# Check system health
ha core info
```

## 🆘 Emergency Recovery

### If Something Goes Wrong:

1. **Restore from Backup**:
```bash
ha backups restore <backup_slug>
```

2. **Reset Configuration**:
```bash
# Via SSH/Terminal
cd /config
cp configuration.yaml.backup configuration.yaml
ha core restart
```

3. **Factory Reset** (Last Resort):
```bash
ha core rebuild
```

4. **Access Recovery Mode**:
- Boot into Home Assistant Recovery mode
- Restore from snapshot
- Rebuild from scratch if necessary

## 📚 Additional Resources

- [Home Assistant API Documentation](https://developers.home-assistant.io/docs/api/rest/)
- [Home Assistant Services](https://www.home-assistant.io/integrations/#services)
- [Security Best Practices](https://www.home-assistant.io/docs/configuration/securing/)
- [Backup & Restore](https://www.home-assistant.io/integrations/backup/)

## 📝 License & Liability

**NO WARRANTY**: This software is provided "as is" without warranty of any kind. The authors are not responsible for:
- Data loss
- System damage
- Security breaches
- Service disruption
- Any consequences of using these tools

**USE AT YOUR OWN RISK**: By using these unrestricted tools, you accept full responsibility for any damage or data loss that may occur.

---

**Last Updated**: October 21, 2025  
**Version**: 2.0.0-unrestricted
