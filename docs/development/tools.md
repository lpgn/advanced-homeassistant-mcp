# Tool Development Guide

This guide explains how to create new tools for the Home Assistant MCP.

## Tool Structure

Each tool should follow this basic structure:

```typescript
interface Tool {
    id: string;
    name: string;
    description: string;
    version: string;
    category: ToolCategory;
    execute(params: any): Promise<ToolResult>;
}
```

## Creating a New Tool

1. Create a new file in the appropriate category directory
2. Implement the Tool interface
3. Add API endpoints
4. Add WebSocket handlers
5. Add documentation
6. Add tests

### Example Tool Implementation

```typescript
import { Tool, ToolCategory, ToolResult } from '../interfaces';

export class MyCustomTool implements Tool {
    id = 'my_custom_tool';
    name = 'My Custom Tool';
    description = 'Description of what the tool does';
    version = '1.0.0';
    category = ToolCategory.Utility;

    async execute(params: any): Promise<ToolResult> {
        // Tool implementation
        return {
            success: true,
            data: {
                // Tool-specific response data
            }
        };
    }
}
```

## Tool Categories

- Device Management
- History & State
- Automation
- Add-ons & Packages
- Notifications
- Events
- Utility

## API Integration

### REST Endpoint

```typescript
import { Router } from 'express';
import { MyCustomTool } from './my-custom-tool';

const router = Router();
const tool = new MyCustomTool();

router.post('/api/tools/custom', async (req, res) => {
    try {
        const result = await tool.execute(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
```

### WebSocket Handler

```typescript
import { WebSocketServer } from 'ws';
import { MyCustomTool } from './my-custom-tool';

const tool = new MyCustomTool();

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const { type, params } = JSON.parse(message);
        if (type === 'my_custom_tool') {
            const result = await tool.execute(params);
            ws.send(JSON.stringify(result));
        }
    });
});
```

## Error Handling

```typescript
class ToolError extends Error {
    constructor(
        message: string,
        public code: string,
        public status: number = 500
    ) {
        super(message);
        this.name = 'ToolError';
    }
}

// Usage in tool
async execute(params: any): Promise<ToolResult> {
    try {
        // Tool implementation
    } catch (error) {
        throw new ToolError(
            'Operation failed',
            'TOOL_ERROR',
            500
        );
    }
}
```

## Testing

```typescript
import { MyCustomTool } from './my-custom-tool';

describe('MyCustomTool', () => {
    let tool: MyCustomTool;

    beforeEach(() => {
        tool = new MyCustomTool();
    });

    it('should execute successfully', async () => {
        const result = await tool.execute({
            // Test parameters
        });
        expect(result.success).toBe(true);
    });

    it('should handle errors', async () => {
        // Error test cases
    });
});
```

## Documentation

1. Create tool documentation in `docs/tools/category/tool-name.md`
2. Update `tools/tools.md` with tool reference
3. Add tool to navigation in `mkdocs.yml`

### Documentation Template

```markdown
# Tool Name

Description of the tool.

## Features

- Feature 1
- Feature 2

## Usage

### REST API

```typescript
// API endpoints
```

### WebSocket

```typescript
// WebSocket usage
```

## Examples

### Example 1

```typescript
// Usage example
```

## Response Format

```json
{
    "success": true,
    "data": {
        // Response data structure
    }
}
```
```

## Best Practices

1. Follow consistent naming conventions
2. Implement proper error handling
3. Add comprehensive documentation
4. Write thorough tests
5. Use TypeScript for type safety
6. Follow SOLID principles
7. Implement rate limiting
8. Add proper logging

## See Also

- [Interface Documentation](interfaces.md)
- [Best Practices](best-practices.md)
- [Testing Guide](../testing.md) 