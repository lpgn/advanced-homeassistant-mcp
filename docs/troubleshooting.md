# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Home Assistant MCP.

## Common Issues

### Connection Issues

#### Cannot Connect to Home Assistant

**Symptoms:**
- Connection timeout errors
- "Failed to connect to Home Assistant" messages
- 401 Unauthorized errors

**Solutions:**
1. Verify Home Assistant is running
2. Check HASS_HOST environment variable
3. Validate HASS_TOKEN is correct
4. Ensure network connectivity
5. Check firewall settings

#### SSE Connection Drops

**Symptoms:**
- Frequent disconnections
- Missing events
- Connection reset errors

**Solutions:**
1. Check network stability
2. Increase connection timeout
3. Implement reconnection logic
4. Monitor server resources

### Authentication Issues

#### Invalid Token

**Symptoms:**
- 401 Unauthorized responses
- "Invalid token" messages
- Authentication failures

**Solutions:**
1. Generate new Long-Lived Access Token
2. Check token expiration
3. Verify token format
4. Update environment variables

#### Rate Limiting

**Symptoms:**
- 429 Too Many Requests
- "Rate limit exceeded" messages

**Solutions:**
1. Implement request throttling
2. Adjust rate limit settings
3. Cache responses
4. Optimize request patterns

### Tool Issues

#### Tool Not Found

**Symptoms:**
- "Tool not found" errors
- 404 Not Found responses

**Solutions:**
1. Check tool name spelling
2. Verify tool registration
3. Update tool imports
4. Check tool availability

#### Tool Execution Fails

**Symptoms:**
- Tool execution errors
- Unexpected responses
- Timeout issues

**Solutions:**
1. Validate input parameters
2. Check error logs
3. Debug tool implementation
4. Verify Home Assistant permissions

## Debugging

### Server Logs

1. Enable debug logging:
   ```env
   LOG_LEVEL=debug
   ```

2. Check logs:
   ```bash
   npm run logs
   ```

3. Filter logs:
   ```bash
   npm run logs | grep "error"
   ```

### Network Debugging

1. Check API endpoints:
   ```bash
   curl -v http://localhost:3000/api/health
   ```

2. Monitor SSE connections:
   ```bash
   curl -N http://localhost:3000/api/sse/stats
   ```

3. Test WebSocket:
   ```bash
   wscat -c ws://localhost:3000
   ```

### Performance Issues

1. Monitor memory usage:
   ```bash
   npm run stats
   ```

2. Check response times:
   ```bash
   curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3000/api/health
   ```

3. Profile code:
   ```bash
   npm run profile
   ```

## FAQ

### Q: How do I reset my configuration?
A: Delete `.env` and copy `.env.example` to start fresh.

### Q: Why are my events delayed?
A: Check network latency and server load. Consider adjusting buffer sizes.

### Q: How do I update my token?
A: Generate a new token in Home Assistant and update HASS_TOKEN.

### Q: Why do I get "Maximum clients reached"?
A: Adjust SSE_MAX_CLIENTS in configuration or clean up stale connections.

## Error Codes

- `E001`: Connection Error
- `E002`: Authentication Error
- `E003`: Rate Limit Error
- `E004`: Tool Error
- `E005`: Configuration Error

## Support Resources

1. Documentation
   - [API Reference](./API.md)
   - [Configuration Guide](./configuration/README.md)
   - [Development Guide](./development/README.md)

2. Community
   - GitHub Issues
   - Discussion Forums
   - Stack Overflow

3. Tools
   - Diagnostic Scripts
   - Testing Tools
   - Monitoring Tools

## Still Need Help?

1. Create a detailed issue:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Logs

2. Contact support:
   - GitHub Issues
   - Email Support
   - Community Forums 