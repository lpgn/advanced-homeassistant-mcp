# Security Policy

## Supported Versions

We actively support the latest version of this project with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

### No External Data Collection

This MCP server does **NOT** collect, transmit, or "phone home" any data to external services. All network communication is exclusively between:

1. **Your AI Assistant** (Claude, GPT, Cursor, etc.) ↔ **This MCP Server**
2. **This MCP Server** ↔ **Your Home Assistant Instance** (configured via `HASS_HOST`)

### Network Calls Audit

All `fetch()` calls in the codebase are documented and verified to only communicate with:

- **Your Home Assistant API** - `HASS_HOST/api/*`
  - Device state queries
  - Service calls (lights, climate, etc.)
  - Automation management
  - Add-on and package management

No telemetry, analytics, or tracking mechanisms are present in this codebase.

### Security Measures

1. **Authentication**: All Home Assistant API calls use Bearer token authentication (`HASS_TOKEN`)
2. **Rate Limiting**: Configurable rate limits to prevent abuse
3. **Input Sanitization**: HTML sanitization to prevent XSS attacks
4. **Security Headers**: Helmet.js integration for HTTP security headers
5. **CORS Protection**: Configurable CORS policies
6. **JWT Support**: Optional JWT authentication for HTTP transport

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** open a public issue
2. Email the maintainers with details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. Allow reasonable time for a response (typically 48-72 hours)

### What to Expect

- **Acknowledgment**: Within 48-72 hours
- **Assessment**: Within 1 week
- **Fix Timeline**: Critical issues within 7 days, others within 30 days
- **Disclosure**: Coordinated disclosure after patch is available

## Security Best Practices for Users

### Environment Variables

Never commit your `.env` file or expose your credentials:

```env
# Keep these secret!
HASS_TOKEN=your_long_lived_access_token
JWT_SECRET=your-secret-key
```

### Network Security

1. **Use HTTPS**: Configure Home Assistant with SSL/TLS
2. **Secure Tokens**: Use long-lived access tokens with appropriate permissions
3. **Firewall**: Restrict access to Home Assistant to trusted networks
4. **Regular Updates**: Keep Home Assistant and this MCP server updated

### Docker Security

If using Docker:

```bash
# Don't expose ports unnecessarily
# Use secrets management
docker run --secret hass_token ...
```

### Rate Limiting

Configure appropriate rate limits in your `.env`:

```env
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=50     # requests per window
```

## Security Checklist for Maintainers

- [x] No external API calls (no telemetry/analytics)
- [x] All fetch() calls documented and audited
- [x] Input validation on all user inputs
- [x] HTML sanitization enabled
- [x] Security headers configured
- [x] Rate limiting implemented
- [x] Authentication required
- [ ] Regular dependency audits (`npm audit`)
- [ ] CodeQL security scanning
- [ ] Automated vulnerability scanning

## Dependencies

We regularly audit our dependencies for vulnerabilities. Notable security-sensitive dependencies:

- `helmet` - Security headers
- `sanitize-html` - XSS prevention  
- `jsonwebtoken` - JWT authentication
- `express-rate-limit` - Rate limiting

## Compliance

This project:
- Does not collect personal data
- Does not transmit data to third parties
- Operates entirely within your local network
- Follows OWASP security guidelines

## Updates and Patches

Security patches are released as soon as possible after a vulnerability is confirmed. Subscribe to GitHub notifications to stay informed.
