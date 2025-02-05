---
layout: default
title: Troubleshooting
nav_order: 6
---

# Troubleshooting Guide 🔧

This guide helps you diagnose and resolve common issues with MCP Server.

## Quick Diagnostics

### Health Check

First, verify the server's health:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "homeAssistant": {
    "connected": true,
    "version": "2024.1.0"
  }
}
```

## Common Issues

### 1. Connection Issues

#### Cannot Connect to MCP Server

**Symptoms:**
- Server not responding
- Connection refused errors
- Timeout errors

**Solutions:**

1. Check if the server is running:
   ```bash
   # For Docker installation
   docker compose ps
   
   # For manual installation
   ps aux | grep mcp
   ```

2. Verify port availability:
   ```bash
   # Check if port is in use
   netstat -tuln | grep 3000
   ```

3. Check logs:
   ```bash
   # Docker logs
   docker compose logs mcp
   
   # Manual installation logs
   bun run dev
   ```

#### Home Assistant Connection Failed

**Symptoms:**
- "Connection Error" in health check
- Cannot control devices
- State updates not working

**Solutions:**

1. Verify Home Assistant URL and token in `.env`:
   ```env
   HA_URL=http://homeassistant:8123
   HA_TOKEN=your_long_lived_access_token
   ```

2. Test Home Assistant connection:
   ```bash
   curl -H "Authorization: Bearer YOUR_HA_TOKEN" \
        http://your-homeassistant:8123/api/
   ```

3. Check network connectivity:
   ```bash
   # For Docker setup
   docker compose exec mcp ping homeassistant
   ```

### 2. Authentication Issues

#### Invalid Token

**Symptoms:**
- 401 Unauthorized responses
- "Invalid token" errors

**Solutions:**

1. Generate a new token:
   ```bash
   curl -X POST http://localhost:3000/auth/token \
     -H "Content-Type: application/json" \
     -d '{"username": "your_username", "password": "your_password"}'
   ```

2. Verify token format:
   ```javascript
   // Token should be in format:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

#### Rate Limiting

**Symptoms:**
- 429 Too Many Requests
- "Rate limit exceeded" errors

**Solutions:**

1. Check current rate limit status:
   ```bash
   curl -I http://localhost:3000/api/state
   ```

2. Adjust rate limits in configuration:
   ```yaml
   security:
     rateLimit: 100  # Increase if needed
     rateLimitWindow: 60000  # Window in milliseconds
   ```

### 3. Real-time Updates Issues

#### SSE Connection Drops

**Symptoms:**
- Frequent disconnections
- Missing state updates
- EventSource errors

**Solutions:**

1. Implement proper reconnection logic:
   ```javascript
   class SSEClient {
       constructor() {
           this.connect();
       }
   
       connect() {
           this.eventSource = new EventSource('/subscribe_events');
           this.eventSource.onerror = this.handleError.bind(this);
       }
   
       handleError(error) {
           console.error('SSE Error:', error);
           this.eventSource.close();
           setTimeout(() => this.connect(), 1000);
       }
   }
   ```

2. Check network stability:
   ```bash
   # Monitor connection stability
   ping -c 100 localhost
   ```

### 4. Performance Issues

#### High Latency

**Symptoms:**
- Slow response times
- Command execution delays
- UI lag

**Solutions:**

1. Enable Redis caching:
   ```env
   REDIS_ENABLED=true
   REDIS_URL=redis://localhost:6379
   ```

2. Monitor system resources:
   ```bash
   # Check CPU and memory usage
   docker stats
   
   # Or for manual installation
   top -p $(pgrep -f mcp)
   ```

3. Optimize database queries and caching:
   ```typescript
   // Use batch operations
   const results = await Promise.all([
       cache.get('key1'),
       cache.get('key2')
   ]);
   ```

### 5. Device Control Issues

#### Commands Not Executing

**Symptoms:**
- Commands appear successful but no device response
- Inconsistent device states
- Error messages from Home Assistant

**Solutions:**

1. Verify device availability:
   ```bash
   curl http://localhost:3000/api/state/light.living_room
   ```

2. Check command syntax:
   ```bash
   # Test basic command
   curl -X POST http://localhost:3000/api/command \
     -H "Content-Type: application/json" \
     -d '{"command": "Turn on living room lights"}'
   ```

3. Review Home Assistant logs:
   ```bash
   docker compose exec homeassistant journalctl -f
   ```

## Debugging Tools

### Log Analysis

Enable debug logging:

```env
LOG_LEVEL=debug
DEBUG=mcp:*
```

### Network Debugging

Monitor network traffic:

```bash
# TCP dump for API traffic
tcpdump -i any port 3000 -w debug.pcap
```

### Performance Profiling

Enable performance monitoring:

```env
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/jango-blockchained/advanced-homeassistant-mcp/issues)
2. Search [Discussions](https://github.com/jango-blockchained/advanced-homeassistant-mcp/discussions)
3. Create a new issue with:
   - Detailed description
   - Logs
   - Configuration (sanitized)
   - Steps to reproduce

## Maintenance

### Regular Health Checks

Run periodic health checks:

```bash
# Create a cron job
*/5 * * * * curl -f http://localhost:3000/health || notify-admin
```

### Log Rotation

Configure log rotation:

```yaml
logging:
  maxSize: "100m"
  maxFiles: "7d"
  compress: true
```

### Backup Configuration

Regularly backup your configuration:

```bash
# Backup script
tar -czf mcp-backup-$(date +%Y%m%d).tar.gz \
    .env \
    config/ \
    data/
``` 