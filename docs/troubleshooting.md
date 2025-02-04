# Troubleshooting Guide

This guide provides solutions to common issues encountered with the Home Assistant MCP Server.

## Common Issues

- **Server Not Starting:**
  - Verify that all required environment variables are correctly set.
  - Check for port conflicts or missing dependencies.
  - Review the server logs for error details.

- **Connection Problems:**
  - Ensure your Home Assistant instance is reachable.
  - Confirm that the authentication token is valid.
  - Check network configurations and firewalls.

## Tool Issues

### Tool Not Found

**Symptoms:**
- "Tool not found" errors or 404 responses.

**Solutions:**
- Double-check the tool name spelling.
- Verify that the tool is correctly registered.
- Review tool imports and documentation.

### Tool Execution Failures

**Symptoms:**
- Execution errors or timeouts.

**Solutions:**
- Validate input parameters.
- Check and review error logs.
- Debug the tool implementation.
- Ensure proper permissions in Home Assistant.

## Debugging Steps

### Server Logs

1. Enable debug logging by setting:
   ```env
   LOG_LEVEL=debug
   ```
2. Check logs:
   ```bash
   npm run logs
   ```
3. Filter errors:
   ```bash
   npm run logs | grep "error"
   ```

### Network Debugging

1. Test API endpoints:
   ```bash
   curl -v http://localhost:3000/api/health
   ```
2. Monitor SSE connections:
   ```bash
   curl -N http://localhost:3000/api/sse/stats
   ```
3. Test WebSocket connectivity:
   ```bash
   wscat -c ws://localhost:3000
   ```

### Performance Issues

- Monitor memory usage with:
  ```bash
  npm run stats
  ```

## Security Middleware Troubleshooting

### Rate Limiting Problems

**Symptoms:** Receiving 429 (Too Many Requests) errors.

**Solutions:**
- Adjust and fine-tune rate limit settings.
- Consider different limits for critical versus non-critical endpoints.

### Request Validation Failures

**Symptoms:** 400 or 415 errors on valid requests.

**Solutions:**
- Verify that the `Content-Type` header is set correctly.
- Inspect request payload size and format.

### Input Sanitization Issues

**Symptoms:** Unexpected data transformation or loss.

**Solutions:**
- Test sanitization with various input types.
- Implement custom sanitization for complex data if needed.

### Security Header Configuration

**Symptoms:** Missing or improper security headers.

**Solutions:**
- Review and update security header configurations (e.g., Helmet settings).
- Ensure environment-specific header settings are in place.

### Error Handling and Logging

**Symptoms:** Inconsistent error responses.

**Solutions:**
- Enhance logging for detailed error tracking.
- Adjust error handlers for production and development differences.

## Additional Resources

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [JWT Security Best Practices](https://jwt.io/introduction)

## Getting Help

If issues persist:
1. Review detailed logs.
2. Verify your configuration and environment.
3. Consult the GitHub issue tracker or community forums.

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
   - [Development Guide](./development/development.md)

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

## Security Middleware Troubleshooting

### Common Issues and Solutions

#### Rate Limiting Problems

**Symptom**: Unexpected 429 (Too Many Requests) errors

**Possible Causes**:
- Misconfigured rate limit settings
- Shared IP addresses (e.g., behind NAT)
- Aggressive client-side retry mechanisms

**Solutions**:
1. Adjust rate limit parameters
   ```typescript
   // Customize rate limit for specific scenarios
   checkRateLimit(ip, maxRequests = 200, windowMs = 30 * 60 * 1000)
   ```

2. Implement more granular rate limiting
   - Use different limits for different endpoints
   - Consider user authentication level

#### Request Validation Failures

**Symptom**: 400 or 415 status codes on valid requests

**Possible Causes**:
- Incorrect `Content-Type` header
- Large request payloads
- Malformed authorization headers

**Debugging Steps**:
1. Verify request headers
   ```typescript
   // Check content type and size
   validateRequestHeaders(request, 'application/json')
   ```

2. Log detailed validation errors
   ```typescript
   try {
     validateRequestHeaders(request);
   } catch (error) {
     console.error('Request validation failed:', error.message);
   }
   ```

#### Input Sanitization Issues

**Symptom**: Unexpected data transformation or loss

**Possible Causes**:
- Complex nested objects
- Non-standard input formats
- Overly aggressive sanitization

**Troubleshooting**:
1. Test sanitization with various input types
   ```typescript
   const input = {
     text: '<script>alert("xss")</script>',
     nested: { html: '<img src="x" onerror="alert(1)">World' }
   };
   const sanitized = sanitizeValue(input);
   ```

2. Custom sanitization for specific use cases
   ```typescript
   function customSanitize(value) {
     // Add custom sanitization logic
     return sanitizeValue(value);
   }
   ```

#### Security Header Configuration

**Symptom**: Missing or incorrect security headers

**Possible Causes**:
- Misconfigured Helmet options
- Environment-specific header requirements

**Solutions**:
1. Custom security header configuration
   ```typescript
   const customHelmetConfig = {
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", 'trusted-cdn.com']
       }
     }
   };
   applySecurityHeaders(request, customHelmetConfig);
   ```

#### Error Handling and Logging

**Symptom**: Inconsistent error responses

**Possible Causes**:
- Incorrect environment configuration
- Unhandled error types

**Debugging Techniques**:
1. Verify environment settings
   ```typescript
   const errorResponse = handleError(error, process.env.NODE_ENV);
   ```

2. Add custom error handling
   ```typescript
   function enhancedErrorHandler(error, env) {
     // Add custom logging or monitoring
     console.error('Security error:', error);
     return handleError(error, env);
   }
   ```

### Performance and Security Monitoring

1. **Logging**
   - Enable debug logging for security events
   - Monitor rate limit and validation logs

2. **Metrics**
   - Track rate limit hit rates
   - Monitor request validation success/failure ratios

3. **Continuous Improvement**
   - Regularly review and update security configurations
   - Conduct periodic security audits

### Environment-Specific Considerations

#### Development
- More verbose error messages
- Relaxed rate limiting
- Detailed security logs

#### Production
- Minimal error details
- Strict rate limiting
- Comprehensive security headers

### External Resources

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [JWT Security Best Practices](https://jwt.io/introduction)

### Getting Help

If you encounter persistent issues:
1. Check application logs
2. Verify environment configurations
3. Consult the project's issue tracker
4. Reach out to the development team with detailed error information 