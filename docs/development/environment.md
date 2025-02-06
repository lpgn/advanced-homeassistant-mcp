# Development Environment Setup

This guide will help you set up your development environment for the Home Assistant MCP Server.

## Prerequisites

### Required Software
- Python 3.10 or higher
- pip (Python package manager)
- git
- Docker (optional, for containerized development)
- Node.js 18+ (for frontend development)

### System Requirements
- 4GB RAM minimum
- 2 CPU cores minimum
- 10GB free disk space

## Initial Setup

1. Clone the Repository
```bash
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp
```

2. Create Virtual Environment
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate  # Windows
```

3. Install Dependencies
```bash
pip install -r requirements.txt
pip install -r docs/requirements.txt  # for documentation
```

## Development Tools

### Code Editor Setup
We recommend using Visual Studio Code with these extensions:
- Python
- Docker
- YAML
- ESLint
- Prettier

### VS Code Settings
```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true
}
```

## Configuration

1. Create Local Config
```bash
cp config.example.yaml config.yaml
```

2. Set Environment Variables
```bash
cp .env.example .env
# Edit .env with your settings
```

## Running Tests

### Unit Tests
```bash
pytest tests/unit
```

### Integration Tests
```bash
pytest tests/integration
```

### Coverage Report
```bash
pytest --cov=src tests/
```

## Docker Development

### Build Container
```bash
docker build -t mcp-server-dev -f Dockerfile.dev .
```

### Run Development Container
```bash
docker run -it --rm \
  -v $(pwd):/app \
  -p 8123:8123 \
  mcp-server-dev
```

## Database Setup

### Local Development Database
```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_USER=mcp \
  -e POSTGRES_PASSWORD=development \
  -e POSTGRES_DB=mcp_dev \
  postgres:14
```

### Run Migrations
```bash
alembic upgrade head
```

## Frontend Development

1. Install Node.js Dependencies
```bash
cd frontend
npm install
```

2. Start Development Server
```bash
npm run dev
```

## Documentation

### Build Documentation
```bash
mkdocs serve
```

### View Documentation
Open http://localhost:8000 in your browser

## Debugging

### VS Code Launch Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: MCP Server",
      "type": "python",
      "request": "launch",
      "program": "src/main.py",
      "console": "integratedTerminal"
    }
  ]
}
```

## Git Hooks

### Install Pre-commit
```bash
pip install pre-commit
pre-commit install
```

### Available Hooks
- black (code formatting)
- flake8 (linting)
- isort (import sorting)
- mypy (type checking)

## Troubleshooting

Common Issues:
1. Port already in use
   - Check for running processes: `lsof -i :8123`
   - Kill process if needed: `kill -9 PID`

2. Database connection issues
   - Verify PostgreSQL is running
   - Check connection settings in .env

3. Virtual environment problems
   - Delete and recreate: `rm -rf .venv && python -m venv .venv`
   - Reinstall dependencies

## Next Steps

1. Review the [Architecture Guide](../architecture.md)
2. Check [Contributing Guidelines](../contributing.md)
3. Start with [Simple Issues](https://github.com/jango-blockchained/homeassistant-mcp/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) 