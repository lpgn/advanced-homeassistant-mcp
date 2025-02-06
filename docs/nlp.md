# Natural Language Processing Guide 🤖

## Overview

My MCP Server includes powerful Natural Language Processing (NLP) capabilities powered by various AI models. This enables intelligent automation analysis, natural language control, and context-aware interactions with your Home Assistant setup.

## Available Models 🎯

### OpenAI Models
- **GPT-4**
  - Best for complex automation analysis
  - Natural language understanding
  - Context window: 8k-32k tokens
  - Recommended for: Automation analysis, complex queries

- **GPT-3.5-Turbo**
  - Faster response times
  - More cost-effective
  - Context window: 4k tokens
  - Recommended for: Quick commands, basic analysis

### Claude Models
- **Claude 2**
  - Excellent code analysis
  - Large context window (100k tokens)
  - Strong system understanding
  - Recommended for: Deep automation analysis

### DeepSeek Models
- **DeepSeek-Coder**
  - Specialized in code understanding
  - Efficient for automation rules
  - Context window: 8k tokens
  - Recommended for: Code generation, rule analysis

## Configuration ⚙️

```bash
# AI Model Configuration
PROCESSOR_TYPE=openai          # openai, claude, or deepseek
OPENAI_MODEL=gpt-3.5-turbo    # or gpt-4, gpt-4-32k
OPENAI_API_KEY=your_key_here

# Optional: DeepSeek Configuration
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Analysis Settings
ANALYSIS_TIMEOUT=30000         # Timeout in milliseconds
MAX_RETRIES=3                 # Number of retries on failure
```

## Usage Examples 💡

### 1. Automation Analysis

```bash
# Analyze an automation rule
bun run analyze-automation path/to/automation.yaml

# Example output:
# "This automation triggers on motion detection and turns on lights.
#  Potential issues:
#  - No timeout for light turn-off
#  - Missing condition for ambient light level"
```

### 2. Natural Language Commands

```typescript
// Send a natural language command
const response = await fetch('http://localhost:3000/api/nlp/command', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    command: "Turn on the living room lights and set them to warm white"
  })
});
```

### 3. Context-Aware Queries

```typescript
// Query with context
const response = await fetch('http://localhost:3000/api/nlp/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: "What's the temperature trend in the bedroom?",
    context: {
      timeframe: "last_24h",
      include_humidity: true
    }
  })
});
```

## Custom Prompts 📝

You can customize the AI's behavior by creating custom prompts. See [Custom Prompts Guide](prompts.md) for details.

Example custom prompt:
```yaml
name: energy_analysis
description: Analyze home energy usage patterns
prompt: |
  Analyze the following energy usage data and provide:
  1. Peak usage patterns
  2. Potential optimizations
  3. Comparison with typical usage
  4. Cost-saving recommendations
  
  Context: {context}
  Data: {data}
```

## Best Practices 🎯

1. **Model Selection**
   - Use GPT-3.5-Turbo for quick queries
   - Use GPT-4 for complex analysis
   - Use Claude for large context analysis
   - Use DeepSeek for code-heavy tasks

2. **Performance Optimization**
   - Cache frequent queries
   - Use streaming for long responses
   - Implement retry logic for API calls

3. **Cost Management**
   - Monitor API usage
   - Implement rate limiting
   - Cache responses where appropriate

4. **Error Handling**
   - Implement fallback models
   - Handle API timeouts gracefully
   - Log failed queries for analysis

## Advanced Features 🚀

### 1. Chain of Thought Analysis
```typescript
const result = await analyzeWithCoT({
  query: "Optimize my morning routine automation",
  steps: ["Parse current automation", "Analyze patterns", "Suggest improvements"]
});
```

### 2. Multi-Model Analysis
```typescript
const results = await analyzeWithMultiModel({
  query: "Security system optimization",
  models: ["gpt-4", "claude-2"],
  compareResults: true
});
```

### 3. Contextual Memory
```typescript
const memory = new ContextualMemory({
  timeframe: "24h",
  maxItems: 100
});

await memory.add("User typically arrives home at 17:30");
```

## Troubleshooting 🔧

### Common Issues

1. **Slow Response Times**
   - Check model selection
   - Verify API rate limits
   - Consider caching

2. **Poor Analysis Quality**
   - Review prompt design
   - Check context window limits
   - Consider using a more capable model

3. **API Errors**
   - Verify API keys
   - Check network connectivity
   - Review rate limits

## API Reference 📚

See [API Documentation](api.md) for detailed endpoint specifications. 