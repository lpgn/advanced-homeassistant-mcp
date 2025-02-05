---
layout: default
title: Contributing
nav_order: 5
---

# Contributing Guide 🤝

Thank you for your interest in contributing to the MCP Server project! This guide will help you get started with contributing to the project.

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- [Bun](https://bun.sh) >= 1.0.26
- [Node.js](https://nodejs.org) >= 18
- [Docker](https://www.docker.com) (optional, for containerized development)
- A running Home Assistant instance for testing

### Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/advanced-homeassistant-mcp.git
   cd advanced-homeassistant-mcp
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up your development environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Home Assistant details
   ```

4. Start the development server:
   ```bash
   bun run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

Example:
```bash
git checkout -b feature/voice-commands
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Maintenance tasks

Examples:
```bash
feat(api): add voice command endpoint
fix(sse): resolve connection timeout issue
docs(readme): update installation instructions
```

### Testing

Run tests before submitting your changes:

```bash
# Run all tests
bun test

# Run specific test file
bun test test/api/command.test.ts

# Run tests with coverage
bun test --coverage
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check code style
bun run lint

# Fix code style issues
bun run lint:fix
```

## Pull Request Process

1. **Update Documentation**
   - Add/update relevant documentation
   - Include inline code comments where necessary
   - Update API documentation if endpoints change

2. **Write Tests**
   - Add tests for new features
   - Update existing tests if needed
   - Ensure all tests pass

3. **Create Pull Request**
   - Fill out the PR template
   - Link related issues
   - Provide clear description of changes

4. **Code Review**
   - Address review comments
   - Keep discussions focused
   - Be patient and respectful

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe your test process

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] All tests passing
```

## Development Guidelines

### Code Organization

```
src/
├── api/          # API endpoints
├── core/         # Core functionality
├── models/       # Data models
├── services/     # Business logic
├── utils/        # Utility functions
└── types/        # TypeScript types
```

### Best Practices

1. **Type Safety**
   ```typescript
   // Use explicit types
   interface CommandRequest {
       command: string;
       parameters?: Record<string, unknown>;
   }
   
   function processCommand(request: CommandRequest): Promise<CommandResponse> {
       // Implementation
   }
   ```

2. **Error Handling**
   ```typescript
   try {
       await processCommand(request);
   } catch (error) {
       if (error instanceof ValidationError) {
           // Handle validation errors
       }
       throw error;
   }
   ```

3. **Async/Await**
   ```typescript
   // Prefer async/await over promises
   async function handleRequest() {
       const result = await processData();
       return result;
   }
   ```

## Documentation

### API Documentation

Update API documentation when adding/modifying endpoints:

```typescript
/**
 * Process a voice command
 * @param command - The voice command to process
 * @returns Promise<CommandResult>
 * @throws {ValidationError} If command is invalid
 */
async function processVoiceCommand(command: string): Promise<CommandResult> {
    // Implementation
}
```

### README Updates

Keep the README up to date with:
- New features
- Changed requirements
- Updated examples
- Modified configuration

## Getting Help

- Check [Discussions](https://github.com/jango-blockchained/advanced-homeassistant-mcp/discussions)
- Review existing [Issues](https://github.com/jango-blockchained/advanced-homeassistant-mcp/issues)

## Community Guidelines

We expect all contributors to:

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a positive environment
- Follow our code style guidelines
- Write clear documentation
- Test their code thoroughly

## License

By contributing, you agree that your contributions will be licensed under the MIT License. 