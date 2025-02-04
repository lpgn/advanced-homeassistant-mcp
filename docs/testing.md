# Testing Documentation

## Quick Reference

```bash
# Most Common Commands
bun test                    # Run all tests
bun test --watch           # Run tests in watch mode
bun test --coverage        # Run tests with coverage
bun test path/to/test.ts   # Run a specific test file

# Additional Options
DEBUG=true bun test        # Run with debug output
bun test --pattern "auth"  # Run tests matching a pattern
bun test --timeout 60000   # Run with a custom timeout
```

## Overview

This document describes the testing setup and practices used in the Home Assistant MCP project. We use Bun's test runner for both unit and integration testing, ensuring comprehensive coverage across modules.

## Test Structure

Tests are organized in two main locations:

1. **Root Level Integration Tests** (`/__tests__/`):

```
__tests__/
├── ai/              # AI/ML component tests
├── api/             # API integration tests
├── context/         # Context management tests
├── hass/            # Home Assistant integration tests
├── schemas/         # Schema validation tests
├── security/        # Security integration tests
├── tools/           # Tools and utilities tests
├── websocket/       # WebSocket integration tests
├── helpers.test.ts  # Helper function tests
├── index.test.ts    # Main application tests
└── server.test.ts   # Server integration tests
```

2. **Component Level Unit Tests** (`src/**/`):

```
src/
├── __tests__/   # Global test setup and utilities
│   └── setup.ts # Global test configuration
├── component/
│   ├── __tests__/   # Component-specific unit tests
│   └── component.ts
```

## Test Configuration

### Bun Test Configuration (`bunfig.toml`)

```toml
[test]
preload = ["./src/__tests__/setup.ts"]  # Global test setup
coverage = true                         # Enable coverage by default
timeout = 30000                         # Test timeout in milliseconds
testMatch = ["**/__tests__/**/*.test.ts"] # Test file patterns
```

### Bun Scripts

Available test commands in `package.json`:

```bash
# Run all tests
bun test

# Watch mode for development
bun test --watch

# Generate coverage report
bun test --coverage

# Run linting
bun run lint

# Format code
bun run format
```

## Test Setup

### Global Configuration

A global test setup file (`src/__tests__/setup.ts`) provides:
- Environment configuration
- Mock utilities
- Test helper functions
- Global lifecycle hooks

### Test Environment

- Environment variables are loaded from `.env.test`.
- Console output is minimized unless `DEBUG=true`.
- JWT secrets and tokens are preconfigured for testing.
- Rate limiting and security features are initialized appropriately.

## Running Tests

```bash
# Basic test run
bun test

# Run tests with coverage
bun test --coverage

# Run a specific test file
bun test path/to/test.test.ts

# Run tests in watch mode
bun test --watch

# Run tests with debug output
DEBUG=true bun test

# Run tests with increased timeout
bun test --timeout 60000

# Run tests matching a pattern
bun test --pattern "auth"
```

## Advanced Debugging

### Using Node Inspector

```bash
# Start tests with inspector
bun test --inspect

# Start tests with inspector and break on first line
bun test --inspect-brk
```

### Using VS Code

Create a launch configuration in `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "bun",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/bun/bin/bun",
      "args": ["test", "${file}"],
      "cwd": "${workspaceFolder}",
      "env": { "DEBUG": "true" }
    }
  ]
}
```

### Test Isolation

To run a single test in isolation:

```typescript
describe.only("specific test suite", () => {
  it.only("specific test case", () => {
    // Only this test will run
  });
});
```

## Writing Tests

### Test File Naming

- Place test files in a `__tests__` directory adjacent to the code being tested.
- Name files with the pattern `*.test.ts`.
- Mirror the structure of the source code in your test organization.

### Example Test Structure

```typescript
describe("Security Features", () => {
  it("should validate tokens correctly", () => {
    const payload = { userId: "123", role: "user" };
    const token = jwt.sign(payload, validSecret, { expiresIn: "1h" });
    const result = TokenManager.validateToken(token, testIp);
    expect(result.valid).toBe(true);
  });
});
```

## Coverage

The project maintains strict coverage:
- Overall coverage: at least 80%
- Critical paths: 90%+
- New features: ≥85% coverage

Generate a coverage report with:

```bash
bun test --coverage
```

## Security Middleware Testing

### Utility Function Testing

The security middleware now uses a utility-first approach, which allows for more granular and comprehensive testing. Each security function is now independently testable, improving code reliability and maintainability.

#### Key Utility Functions

1. **Rate Limiting (`checkRateLimit`)**
   - Tests multiple scenarios:
     - Requests under threshold
     - Requests exceeding threshold
     - Rate limit reset after window expiration
   
   ```typescript
   // Example test
   it('should throw when requests exceed threshold', () => {
     const ip = '127.0.0.2';
     for (let i = 0; i < 11; i++) {
       if (i < 10) {
         expect(() => checkRateLimit(ip, 10)).not.toThrow();
       } else {
         expect(() => checkRateLimit(ip, 10)).toThrow('Too many requests from this IP');
       }
     }
   });
   ```

2. **Request Validation (`validateRequestHeaders`)**
   - Tests content type validation
   - Checks request size limits
   - Validates authorization headers
   
   ```typescript
   it('should reject invalid content type', () => {
     const mockRequest = new Request('http://localhost', {
       method: 'POST',
       headers: { 'content-type': 'text/plain' }
     });
     expect(() => validateRequestHeaders(mockRequest)).toThrow('Content-Type must be application/json');
   });
   ```

3. **Input Sanitization (`sanitizeValue`)**
   - Sanitizes HTML tags
   - Handles nested objects
   - Preserves non-string values
   
   ```typescript
   it('should sanitize HTML tags', () => {
     const input = '<script>alert("xss")</script>Hello';
     const sanitized = sanitizeValue(input);
     expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello');
   });
   ```

4. **Security Headers (`applySecurityHeaders`)**
   - Verifies correct security header application
   - Checks CSP, frame options, and other security headers
   
   ```typescript
   it('should apply security headers', () => {
     const mockRequest = new Request('http://localhost');
     const headers = applySecurityHeaders(mockRequest);
     expect(headers['content-security-policy']).toBeDefined();
     expect(headers['x-frame-options']).toBeDefined();
   });
   ```

5. **Error Handling (`handleError`)**
   - Tests error responses in production and development modes
   - Verifies error message and stack trace inclusion
   
   ```typescript
   it('should include error details in development mode', () => {
     const error = new Error('Test error');
     const result = handleError(error, 'development');
     expect(result).toEqual({
       error: true,
       message: 'Internal server error',
       error: 'Test error',
       stack: expect.any(String)
     });
   });
   ```

### Testing Philosophy

- **Isolation**: Each utility function is tested independently
- **Comprehensive Coverage**: Multiple scenarios for each function
- **Predictable Behavior**: Clear expectations for input and output
- **Error Handling**: Robust testing of error conditions

### Best Practices

1. Use minimal, focused test cases
2. Test both successful and failure scenarios
3. Verify input sanitization and security measures
4. Mock external dependencies when necessary

### Running Security Tests

```bash
# Run all tests
bun test

# Run specific security tests
bun test __tests__/security/
```

### Continuous Improvement

- Regularly update test cases
- Add new test scenarios as security requirements evolve
- Perform periodic security audits

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state of other tests.
2. **Mocking**: Use the provided mock utilities for external dependencies.
3. **Cleanup**: Clean up any resources or state modifications in `afterEach` or `afterAll` hooks.
4. **Descriptive Names**: Use clear, descriptive test names that explain the expected behavior.
5. **Assertions**: Make specific, meaningful assertions rather than general ones.
6. **Setup**: Use `beforeEach` for common test setup to avoid repetition.
7. **Error Cases**: Test both success and error cases for complete coverage.

## Coverage

The project aims for high test coverage, particularly focusing on:
- Security-critical code paths
- API endpoints
- Data validation
- Error handling
- Event broadcasting

Run coverage reports using:
```bash
bun test --coverage
```

## Debugging Tests

To debug tests:
1. Set `DEBUG=true` to enable console output during tests
2. Use the `--watch` flag for development
3. Add `console.log()` statements (they're only shown when DEBUG is true)
4. Use the test utilities' debugging helpers

### Advanced Debugging

1. **Using Node Inspector**:
   ```bash
   # Start tests with inspector
   bun test --inspect
   
   # Start tests with inspector and break on first line
   bun test --inspect-brk
   ```

2. **Using VS Code**:
   ```jsonc
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "bun",
         "request": "launch",
         "name": "Debug Tests",
         "program": "${workspaceFolder}/node_modules/bun/bin/bun",
         "args": ["test", "${file}"],
         "cwd": "${workspaceFolder}",
         "env": { "DEBUG": "true" }
       }
     ]
   }
   ```

3. **Test Isolation**:
   To run a single test in isolation:
   ```typescript
   describe.only("specific test suite", () => {
     it.only("specific test case", () => {
       // Only this test will run
     });
   });
   ```

## Contributing

When contributing new code:
1. Add tests for new features
2. Ensure existing tests pass
3. Maintain or improve coverage
4. Follow the existing test patterns and naming conventions
5. Document any new test utilities or patterns 

## Coverage Requirements

The project maintains strict coverage requirements:

- Minimum overall coverage: 80%
- Critical paths (security, API, data validation): 90%
- New features must include tests with >= 85% coverage

Coverage reports are generated in multiple formats:
- Console summary
- HTML report (./coverage/index.html)
- LCOV report (./coverage/lcov.info)

To view detailed coverage:
```bash
# Generate and open coverage report
bun test --coverage && open coverage/index.html
``` 