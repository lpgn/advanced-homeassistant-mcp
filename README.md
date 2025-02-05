# 🚀 MCP Server for Home Assistant - Bringing AI-Powered Smart Homes to Life!

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.26-black)](https://bun.sh)  
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org)  
[![Test Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)](#)  
[![Documentation](https://img.shields.io/badge/docs-github.io-blue.svg)](https://jango-blockchained.github.io/homeassistant-mcp/)  
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.10.8-blue)](https://www.docker.com)

---

## Overview 🌐

Welcome to the **Model Context Protocol (MCP) Server for Home Assistant**! This robust platform bridges Home Assistant with cutting-edge Language Learning Models (LLMs), enabling natural language interactions and real-time automation of your smart devices. Imagine entering your home, saying:  

> "Hey MCP, dim the lights and start my evening playlist,"  

and watching your home transform instantly—that's the magic that MCP Server delivers!

---

## Key Benefits ✨

### 🎮 Device Control & Monitoring
- **Voice-Controlled Automation:**  
  Use simple commands like "Turn on the kitchen lights" or "Set the thermostat to 22°C" without touching a switch.  
  **Real-World Example:**  
  In the morning, say "Good morning! Open the blinds and start the coffee machine" to kickstart your day automatically.

- **Real-Time Communication:**  
  Experience sub-100ms latency updates via Server-Sent Events (SSE) or WebSocket connections, ensuring your dashboard is always current.  
  **Real-World Example:**  
  Monitor energy usage instantly during peak hours and adjust remotely for efficient consumption.

- **Seamless Automation:**  
  Create scene-based rules to synchronize multiple devices effortlessly.  
  **Real-World Example:**  
  For movie nights, have MCP dim the lights, adjust the sound system, and launch your favorite streaming app with just one command.

### 🤖 AI-Powered Enhancements
- **Natural Language Processing (NLP):**  
  Convert everyday speech into actionable commands—just say, "Prepare the house for dinner," and MCP will adjust lighting, temperature, and even play soft background music.

- **Predictive Automation & Suggestions:**  
  Receive proactive recommendations based on usage habits and environmental trends.  
  **Real-World Example:**  
  When home temperature fluctuates unexpectedly, MCP suggests an optimal setting and notifies you immediately.

- **Anomaly Detection:**  
  Continuously monitor device activity and alert you to unusual behavior, helping prevent malfunctions or potential security breaches.

---

## Architectural Overview 🏗

Our architecture is engineered for performance, scalability, and security. The following Mermaid diagram illustrates the data flow and component interactions:

```mermaid
graph TD
    subgraph Client
       A[Client Application<br>(Web / Mobile / Voice)]
    end
    subgraph CDN
       B[CDN / Cache]
    end
    subgraph Server
       C[Bun Native Server]
       E[NLP Engine &<br>Language Processing Module]
    end
    subgraph Integration
       D[Home Assistant<br>(Devices, Lights, Thermostats)]
    end

    A -->|HTTP Request| B
    B -- Cache Miss --> C
    C -->|Interpret Command| E
    E -->|Determine Action| D
    D -->|Return State/Action| C
    C -->|Response| B
    B -->|Cached/Processed Response| A
```

Learn more about our architecture in the [Architecture Documentation](docs/architecture.md).

---

## Technical Stack 🔧

Our solution is built on a modern, high-performance stack that powers every feature:

- **Bun:**  
  A next-generation JavaScript runtime offering rapid startup times, native TypeScript support, and high performance.  
  👉 [Learn about Bun](https://bun.sh)

- **Bun Native Server:**  
  Utilizes Bun's built-in HTTP server to efficiently process API requests with sub-100ms response times.  
  👉 See the [Installation Guide](docs/getting-started/installation.md) for details.

- **Natural Language Processing (NLP) & LLM Integration:**  
  Processes and interprets natural language commands using state-of-the-art LLMs and custom NLP modules.  
  👉 Find API usage details in the [API Documentation](docs/api.md).

- **Home Assistant Integration:**  
  Provides seamless connectivity with Home Assistant, ensuring flawless communication with your smart devices.  
  👉 Refer to the [Usage Guide](docs/usage.md) for more information.

- **Redis Cache:**  
  Enables rapid data retrieval and session persistence essential for real-time updates.

- **TypeScript:**  
  Enhances type safety and developer productivity across the entire codebase.

- **JWT & Security Middleware:**  
  Protects your ecosystem with JWT-based authentication, request sanitization, rate-limiting, and encryption.

- **Containerization with Docker:**  
  Enables scalable, isolated deployments for production environments.

For further technical details, check out our [Documentation Index](docs/index.md).

---

## Installation 🛠

### Installing via Smithery

To install Home Assistant MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@jango-blockchained/advanced-homeassistant-mcp):

```bash
npx -y @smithery/cli install @jango-blockchained/advanced-homeassistant-mcp --client claude
```

### 🐳 Docker Setup (Recommended)

For a hassle-free, containerized deployment:

```bash
# 1. Clone the repository (using a shallow copy for efficiency)
git clone --depth 1 https://github.com/jango-blockchained/homeassistant-mcp.git

# 2. Configure your environment: copy the example file and edit it with your Home Assistant credentials
cp .env.example .env  # Modify .env with your Home Assistant host, tokens, etc.

# 3. Build and run the Docker containers
docker compose up -d --build

# 4. View real-time logs (last 50 log entries)
docker compose logs -f --tail=50
```

👉 Refer to our [Installation Guide](docs/getting-started/installation.md) for full details.

### 💻 Bare Metal Installation

For direct deployment on your host machine:

```bash
# 1. Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# 2. Install project dependencies with caching support
bun install --frozen-lockfile

# 3. Launch the server in development mode with hot-reload enabled
bun run dev --watch
```

---

## Real-World Usage Examples 🔍

### 📱 Smart Home Dashboard Integration
Integrate MCP's real-time updates into your custom dashboard for a dynamic smart home experience:

```javascript
const eventSource = new EventSource('http://localhost:3000/subscribe_events?token=YOUR_TOKEN&domain=light');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Real-time update:', data);
    // Update your UI dashboard, e.g., refresh a light intensity indicator.
};
```

### 🏠 Voice-Activated Control
Utilize voice commands to trigger actions with minimal effort:

```javascript
// Establish a WebSocket connection for real-time command processing
const ws = new WebSocket('wss://mcp.yourha.com/ws');

ws.onmessage = ({ data }) => {
    const update = JSON.parse(data);
    if (update.entity_id === 'light.living_room') {
        console.log('Adjusting living room lighting based on voice command...');
        // Additional logic to update your UI or trigger further actions can go here.
    }
};

// Simulate processing a voice command
function simulateVoiceCommand(command) {
    console.log("Processing voice command:", command);
    // Integrate with your actual voice-to-text system as needed.
}

simulateVoiceCommand("Turn off all the lights for bedtime");
```

👉 Learn more in our [Usage Guide](docs/usage.md).

---

## Update Strategy 🔄

Maintain a seamless operation with zero downtime updates:

```bash
# 1. Pull the latest Docker images
docker compose pull

# 2. Rebuild and restart containers smoothly
docker compose up -d --build

# 3. Clean up unused Docker images to free up space
docker system prune -f
```

For more details, review our [Troubleshooting & Updates](docs/troubleshooting.md).

---

## Security Features 🔐

We prioritize the security of your smart home with multiple layers of defense:
- **JWT Authentication 🔑:** Secure, token-based API access to prevent unauthorized usage.
- **Request Sanitization 🧼:** Automatic filtering and validation of API requests to combat injection attacks.
- **Rate Limiting & Fail2Ban 🚫:** Monitors requests to prevent brute force and DDoS attacks.
- **End-to-End Encryption 🔒:** Ensures that your commands and data remain private during transmission.

---

## Contributing 🤝

We value community contributions! Here's how you can help improve MCP Server:
1. **Fork the Repository 🍴**  
   Create your own copy of the project.
2. **Create a Feature Branch 🌿**
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. **Install Dependencies & Run Tests 🧪**
    ```bash
    bun install
    bun test --coverage
    ```
4. **Make Your Changes & Commit 📝**  
   Follow the [Conventional Commits](https://www.conventionalcommits.org) guidelines.
5. **Open a Pull Request 🔀**  
   Submit your changes for review.

Read more in our [Contribution Guidelines](docs/contributing.md).

---

## Roadmap & Future Enhancements 🔮

We're continuously evolving MCP Server. Upcoming features include:
- **AI Assistant Integration (Q4 2024):**  
  Smarter, context-aware voice commands and personalized automation.
- **Predictive Automation (Q1 2025):**  
  Enhanced scheduling capabilities powered by advanced AI.
- **Enhanced Security (Q2 2024):**  
  Introduction of multi-factor authentication, advanced monitoring, and rigorous encryption methods.
- **Performance Optimizations (Q3 2024):**  
  Reducing latency further, optimizing caching, and improving load balancing.

For more details, see our [Roadmap](docs/roadmap.md).

---

## Community & Support 🌍

Your feedback and collaboration are vital! Join our community:
- **GitHub Issues:** Report bugs or request features via our [Issues Page](https://github.com/jango-blockchained/homeassistant-mcp/issues).
- **Discord & Slack:** Connect with fellow users and developers in real-time.
- **Documentation:** Find comprehensive guides on the [MCP Documentation Website](https://jango-blockchained.github.io/homeassistant-mcp/).

---

## License 📜

This project is licensed under the MIT License. See [LICENSE](LICENSE) for full details.

---

🔋 Batteries included.

## MCP Client Integration

This MCP server can be integrated with various clients that support the Model Context Protocol. Below are instructions for different client integrations:

### Cursor Integration

The server can be integrated with Cursor by adding the configuration to `.cursor/config/config.json`:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "bun",
      "args": ["run", "start"],
      "cwd": "${workspaceRoot}",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Claude Desktop Integration

For Claude Desktop, add the following to your Claude configuration file:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "bun",
      "args": ["run", "start", "--port", "8080"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Cline Integration

For Cline-based clients, add the following configuration:

```json
{
  "mcpServers": {
    "homeassistant-mcp": {
      "command": "bun",
      "args": [
        "run",
        "start",
        "--enable-cline",
        "--config",
        "${configDir}/.env"
      ],
      "env": {
        "NODE_ENV": "production",
        "CLINE_MODE": "true"
      }
    }
  }
}
```

### Command Line Usage

#### Windows
A CMD script is provided in the `scripts` directory. To use it:

1. Navigate to the `scripts` directory
2. Run `start_mcp.cmd`

The script will start the MCP server with default configuration.
