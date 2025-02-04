# API Documentation

This section details the available API endpoints for the Home Assistant MCP Server.

## Device Control

### Common Entity Controls

```json
{
  "tool": "control",
  "command": "turn_on",  // Options: "turn_on", "turn_off", "toggle"
  "entity_id": "light.living_room"
}
```

### Light Control

```json
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "light.living_room",
  "brightness": 128,
  "color_temp": 4000,
  "rgb_color": [255, 0, 0]
}
```

## Add-on Management

### List Available Add-ons

```json
{
  "tool": "addon",
  "action": "list"
}
```

### Install Add-on

```json
{
  "tool": "addon",
  "action": "install",
  "slug": "core_configurator",
  "version": "5.6.0"
}
```

### Manage Add-on State

```json
{
  "tool": "addon",
  "action": "start",  // Options: "start", "stop", "restart"
  "slug": "core_configurator"
}
```

## Package Management

### List HACS Packages

```json
{
  "tool": "package",
  "action": "list",
  "category": "integration"  // Options: "integration", "plugin", "theme", "python_script", "appdaemon", "netdaemon"
}
```

### Install Package

```json
{
  "tool": "package",
  "action": "install",
  "category": "integration",
  "repository": "hacs/integration",
  "version": "1.32.0"
}
```

## Automation Management

For automation management details and endpoints, please refer to the [Tools Documentation](tools/README.md).

## Security Considerations

- Validate and sanitize all user inputs.
- Enforce rate limiting to prevent abuse.
- Apply proper security headers.
- Gracefully handle errors based on the environment.

## Troubleshooting

If you experience issues with the API:
- Verify the endpoint and request payload.
- Check authentication tokens and required headers.
- Consult the [Troubleshooting Guide](troubleshooting.md) for further guidance.

## MCP Schema Endpoint

The server exposes an MCP (Model Context Protocol) schema endpoint that describes all available tools and their parameters:

```http
GET /mcp
```

This endpoint returns a JSON schema describing all available tools, their parameters, and documentation resources. The schema follows the MCP specification and can be used by LLM clients to understand the server's capabilities.

Example response:
```json
{
  "tools": [
    {
      "name": "list_devices",
      "description": "List all devices connected to Home Assistant",
      "parameters": {
        "type": "object",
        "properties": {
          "domain": {
            "type": "string",
            "enum": ["light", "climate", "alarm_control_panel", ...]
          },
          "area": { "type": "string" },
          "floor": { "type": "string" }
        }
      }
    },
    // ... other tools
  ],
  "prompts": [],
  "resources": [
    {
      "name": "Home Assistant API",
      "url": "https://developers.home-assistant.io/docs/api/rest/"
    }
  ]
}
```

Note: The `/mcp` endpoint is publicly accessible and does not require authentication, as it only provides schema information.

## Core Functions

### State Management
```http
GET /api/state
POST /api/state
```

Manages the current state of the system.

**Example Request:**
```json
POST /api/state
{
  "context": "living_room",
  "state": {
    "lights": "on",
    "temperature": 22
  }
}
```

### Context Updates
```http
POST /api/context
```

Updates the current context with new information.

**Example Request:**
```json
POST /api/context
{
  "user": "john",
  "location": "kitchen",
  "time": "morning",
  "activity": "cooking"
}
```

## Action Endpoints

### Execute Action
```http
POST /api/action
```

Executes a specified action with given parameters.

**Example Request:**
```json
POST /api/action
{
  "action": "turn_on_lights",
  "parameters": {
    "room": "living_room",
    "brightness": 80
  }
}
```

### Batch Actions
```http
POST /api/actions/batch
```

Executes multiple actions in sequence.

**Example Request:**
```json
POST /api/actions/batch
{
  "actions": [
    {
      "action": "turn_on_lights",
      "parameters": {
        "room": "living_room"
      }
    },
    {
      "action": "set_temperature",
      "parameters": {
        "temperature": 22
      }
    }
  ]
}
```

## Query Functions

### Get Available Actions
```http
GET /api/actions
```

Returns a list of all available actions.

**Example Response:**
```json
{
  "actions": [
    {
      "name": "turn_on_lights",
      "parameters": ["room", "brightness"],
      "description": "Turns on lights in specified room"
    },
    {
      "name": "set_temperature",
      "parameters": ["temperature"],
      "description": "Sets temperature in current context"
    }
  ]
}
```

### Context Query
```http
GET /api/context?type=current
```

Retrieves context information.

**Example Response:**
```json
{
  "current_context": {
    "user": "john",
    "location": "kitchen",
    "time": "morning",
    "activity": "cooking"
  }
}
```

## WebSocket Events

The server supports real-time updates via WebSocket connections.

```javascript
// Client-side connection example
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
};
```

### Supported Events

- `state_change`: Emitted when system state changes
- `context_update`: Emitted when context is updated
- `action_executed`: Emitted when an action is completed
- `error`: Emitted when an error occurs

**Example Event Data:**
```json
{
  "event": "state_change",
  "data": {
    "previous_state": {
      "lights": "off"
    },
    "current_state": {
      "lights": "on"
    },
    "timestamp": "2024-03-20T10:30:00Z"
  }
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

**Error Response Format:**
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Missing required parameter: room",
    "details": {
      "missing_fields": ["room"]
    }
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- 100 requests per minute per IP for regular endpoints
- 1000 requests per minute per IP for WebSocket connections

When rate limit is exceeded, the server returns:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "reset_time": "2024-03-20T10:31:00Z"
  }
}
```

## Example Usage

### Using curl
```bash
# Get current state
curl -X GET \
  http://localhost:3000/api/state \
  -H 'Authorization: ApiKey your_api_key_here'

# Execute action
curl -X POST \
  http://localhost:3000/api/action \
  -H 'Authorization: ApiKey your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "turn_on_lights",
    "parameters": {
      "room": "living_room",
      "brightness": 80
    }
  }'
```

### Using JavaScript
```javascript
// Execute action
async function executeAction() {
  const response = await fetch('http://localhost:3000/api/action', {
    method: 'POST',
    headers: {
      'Authorization': 'ApiKey your_api_key_here',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'turn_on_lights',
      parameters: {
        room: 'living_room',
        brightness: 80
      }
    })
  });
  
  const data = await response.json();
  console.log('Action result:', data);
}
```

## Security Middleware

### Overview

The security middleware provides a comprehensive set of utility functions to enhance the security of the Home Assistant MCP application. These functions cover various aspects of web security, including:

- Rate limiting
- Request validation
- Input sanitization
- Security headers
- Error handling

### Utility Functions

#### `checkRateLimit(ip: string, maxRequests?: number, windowMs?: number)`

Manages rate limiting for IP addresses to prevent abuse.

**Parameters**:
- `ip`: IP address to track
- `maxRequests`: Maximum number of requests allowed (default: 100)
- `windowMs`: Time window for rate limiting (default: 15 minutes)

**Returns**: `boolean` or throws an error if limit is exceeded

**Example**:
```typescript
try {
  checkRateLimit('127.0.0.1'); // Checks rate limit with default settings
} catch (error) {
  // Handle rate limit exceeded
}
```

#### `validateRequestHeaders(request: Request, requiredContentType?: string)`

Validates incoming HTTP request headers for security and compliance.

**Parameters**:
- `request`: The incoming HTTP request
- `requiredContentType`: Expected content type (default: 'application/json')

**Checks**:
- Content type
- Request body size
- Authorization header (optional)

**Example**:
```typescript
try {
  validateRequestHeaders(request);
} catch (error) {
  // Handle validation errors
}
```

#### `sanitizeValue(value: unknown)`

Sanitizes input values to prevent XSS attacks.

**Features**:
- Escapes HTML tags
- Handles nested objects and arrays
- Preserves non-string values

**Example**:
```typescript
const sanitized = sanitizeValue('<script>alert("xss")</script>');
// Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
```

#### `applySecurityHeaders(request: Request, helmetConfig?: HelmetOptions)`

Applies security headers to HTTP requests using Helmet.

**Security Headers**:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- HSTS (in production)

**Example**:
```typescript
const headers = applySecurityHeaders(request);
```

#### `handleError(error: Error, env?: string)`

Handles error responses with environment-specific details.

**Modes**:
- Production: Generic error message
- Development: Detailed error with stack trace

**Example**:
```typescript
const errorResponse = handleError(error, process.env.NODE_ENV);
```

### Middleware Usage

These utility functions are integrated into Elysia middleware:

```typescript
const app = new Elysia()
  .use(rateLimiter)      // Rate limiting
  .use(validateRequest)  // Request validation
  .use(sanitizeInput)    // Input sanitization
  .use(securityHeaders)  // Security headers
  .use(errorHandler)     // Error handling
```

### Best Practices

1. Always validate and sanitize user inputs
2. Use rate limiting to prevent abuse
3. Apply security headers
4. Handle errors gracefully
5. Keep environment-specific error handling

### Security Considerations

- Configurable rate limits
- XSS protection
- Content security policies
- Token validation
- Error information exposure control

### Troubleshooting

- Ensure `JWT_SECRET` is set in environment
- Check content type in requests
- Monitor rate limit errors
- Review error handling in different environments 