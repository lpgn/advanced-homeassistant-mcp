# Development Guide

This guide provides information for developers who want to contribute to or extend the Home Assistant MCP.

## Project Structure

```
homeassistant-mcp/
├── src/
│   ├── __tests__/        # Test files
│   ├── __mocks__/       # Mock files
│   ├── api/           # API endpoints and route handlers
│   ├── config/        # Configuration management
│   ├── hass/         # Home Assistant integration
│   ├── interfaces/    # TypeScript interfaces
│   ├── mcp/          # MCP core functionality
│   ├── middleware/    # Express middleware
│   ├── routes/       # Route definitions
│   ├── security/     # Security utilities
│   ├── sse/          # Server-Sent Events handling
│   ├── tools/        # Tool implementations
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── __tests__/        # Test files
├── docs/            # Documentation
├── dist/           # Compiled JavaScript
└── scripts/        # Build and utility scripts
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up development environment:
   ```bash
   cp .env.example .env.development
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Code Style

We follow these coding standards:

1. TypeScript best practices
   - Use strict type checking
   - Avoid `any` types
   - Document complex types

2. ESLint rules
   - Run `npm run lint` to check
   - Run `npm run lint:fix` to auto-fix

3. Code formatting
   - Use Prettier
   - Run `npm run format` to format code

## Testing

1. Unit tests:
   ```bash
   npm run test
   ```

2. Integration tests:
   ```bash
   npm run test:integration
   ```

3. Coverage report:
   ```bash
   npm run test:coverage
   ```

## Creating New Tools

1. Create a new file in `src/tools/`:
   ```typescript
   import { z } from 'zod';
   import { Tool } from '../types';

   export const myTool: Tool = {
     name: 'my_tool',
     description: 'Description of my tool',
     parameters: z.object({
       // Define parameters
     }),
     execute: async (params) => {
       // Implement tool logic
     }
   };
   ```

2. Add to `src/tools/index.ts`
3. Create tests in `__tests__/tools/`
4. Add documentation in `docs/tools/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit a pull request

### Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Update CHANGELOG.md
4. Get review from maintainers

## Building

1. Development build:
   ```bash
   npm run build:dev
   ```

2. Production build:
   ```bash
   npm run build
   ```

## Documentation

1. Update documentation for changes
2. Follow documentation structure
3. Include examples
4. Update type definitions

## Debugging

1. Development debugging:
   ```bash
   npm run dev:debug
   ```

2. Test debugging:
   ```bash
   npm run test:debug
   ```

3. VSCode launch configurations provided

## Performance

1. Follow performance best practices
2. Use caching where appropriate
3. Implement rate limiting
4. Monitor memory usage

## Security

1. Follow security best practices
2. Validate all inputs
3. Use proper authentication
4. Handle errors securely

## Deployment

1. Build for production:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

3. Docker deployment:
   ```bash
   docker-compose up -d
   ```

## Support

Need development help?
1. Check documentation
2. Search issues
3. Create new issue
4. Join discussions 