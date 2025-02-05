---
layout: default
title: Contributing
nav_order: 5
---

# Contributing Guide 🤝

Thank you for your interest in contributing to the MCP Server project!

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.26
- Home Assistant instance
- Basic understanding of TypeScript

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/homeassistant-mcp.git
   cd homeassistant-mcp
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Home Assistant details
   ```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates

Example:
```bash
git checkout -b feature/device-control-improvements
```

### Commit Messages

Follow simple, clear commit messages:

```
type: brief description

[optional detailed explanation]
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `chore:` - Maintenance

### Code Style

- Use TypeScript
- Follow existing code structure
- Keep changes focused and minimal

## Testing

Run tests before submitting:

```bash
# Run all tests
bun test

# Run specific test
bun test test/api/control.test.ts
```

## Pull Request Process

1. Ensure tests pass
2. Update documentation if needed
3. Provide clear description of changes

### PR Template

```markdown
## Description
Brief explanation of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update

## Testing
Describe how you tested these changes
```

## Reporting Issues

- Use GitHub Issues
- Provide clear, reproducible steps
- Include environment details

## Code of Conduct

- Be respectful
- Focus on constructive feedback
- Help maintain a positive environment

## Resources

- [API Documentation](api.md)
- [Troubleshooting Guide](troubleshooting.md)

*Thank you for contributing!* 