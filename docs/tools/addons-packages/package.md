# Package Management Tool

The Package Management tool provides functionality to manage Home Assistant Community Store (HACS) packages through the MCP interface.

## Features

- List available packages
- Install/update/remove packages
- Search packages
- Get package information
- Manage package repositories
- Track package updates
- View package documentation
- Monitor package status

## Usage

### REST API

```typescript
GET /api/packages
GET /api/packages/{package_id}
POST /api/packages/{package_id}/install
POST /api/packages/{package_id}/uninstall
POST /api/packages/{package_id}/update
GET /api/packages/search
GET /api/packages/categories
GET /api/packages/repositories
```

### WebSocket

```typescript
// List packages
{
    "type": "get_packages",
    "category": "optional_category"
}

// Search packages
{
    "type": "search_packages",
    "query": "search_query",
    "category": "optional_category"
}

// Install package
{
    "type": "install_package",
    "package_id": "required_package_id",
    "version": "optional_version"
}
```

## Package Categories

- Integrations
- Frontend
- Themes
- AppDaemon Apps
- NetDaemon Apps
- Python Scripts
- Plugins

## Examples

### List All Packages

```typescript
const response = await fetch('http://your-ha-mcp/api/packages', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const packages = await response.json();
```

### Search Packages

```typescript
const response = await fetch('http://your-ha-mcp/api/packages/search?q=weather&category=integrations', {
    headers: {
        'Authorization': 'Bearer your_access_token'
    }
});
const searchResults = await response.json();
```

### Install Package

```typescript
const response = await fetch('http://your-ha-mcp/api/packages/custom-weather-card/install', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your_access_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "version": "latest"
    })
});
```

## Response Format

### Package List Response

```json
{
    "success": true,
    "data": {
        "packages": [
            {
                "id": "package_id",
                "name": "Package Name",
                "category": "integrations",
                "description": "Package description",
                "version": "1.0.0",
                "installed": true,
                "update_available": false,
                "stars": 150,
                "downloads": 10000
            }
        ]
    }
}
```

### Package Info Response

```json
{
    "success": true,
    "data": {
        "package": {
            "id": "package_id",
            "name": "Package Name",
            "category": "integrations",
            "description": "Package description",
            "long_description": "Detailed description",
            "version": "1.0.0",
            "installed_version": "0.9.0",
            "available_version": "1.0.0",
            "installed": true,
            "update_available": true,
            "stars": 150,
            "downloads": 10000,
            "repository": "https://github.com/author/repo",
            "author": {
                "name": "Author Name",
                "url": "https://github.com/author"
            },
            "documentation": "https://github.com/author/repo/wiki",
            "dependencies": [
                "dependency1",
                "dependency2"
            ]
        }
    }
}
```

### Search Response

```json
{
    "success": true,
    "data": {
        "results": [
            {
                "id": "package_id",
                "name": "Package Name",
                "category": "integrations",
                "description": "Package description",
                "version": "1.0.0",
                "score": 0.95
            }
        ],
        "total": 42
    }
}
```

## Error Handling

### Common Error Codes

- `404`: Package not found
- `401`: Unauthorized
- `400`: Invalid request
- `409`: Package operation failed
- `422`: Invalid configuration
- `424`: Dependency error

### Error Response Format

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE"
}
```

## Rate Limiting

- Default limit: 50 requests per 15 minutes
- Configurable through environment variables:
  - `PACKAGE_RATE_LIMIT`
  - `PACKAGE_RATE_WINDOW`

## Best Practices

1. Check package compatibility
2. Review package documentation
3. Verify package dependencies
4. Back up before updates
5. Test in safe environment
6. Monitor resource usage
7. Keep packages updated
8. Handle rate limiting gracefully

## Package Security

- Verify package sources
- Review package permissions
- Check package reputation
- Monitor package activity
- Keep dependencies updated
- Follow security advisories

## See Also

- [Add-on Management](addon.md)
- [Device Control](../device-management/control.md)
- [Event Subscription](../events/subscribe-events.md) 