# Extras & Tools Guide 🛠️

## Overview

I've included several additional tools and utilities in the `extra/` directory to enhance your Home Assistant MCP experience. These tools help with automation analysis, speech processing, and client integration.

## Available Tools 🧰

### 1. Home Assistant Analyzer CLI
```bash
# Installation
bun install -g @homeassistant-mcp/ha-analyzer-cli

# Usage
ha-analyzer analyze path/to/automation.yaml
```

Features:
- 🔍 Deep automation analysis using AI models
- 🚨 Security vulnerability scanning
- 💡 Performance optimization suggestions
- 📊 System health metrics
- ⚡ Energy usage analysis
- 🤖 Automation improvement recommendations

### 2. Speech-to-Text Example
```bash
# Run the example
bun run extra/speech-to-text-example.ts
```

Features:
- 🎤 Wake word detection ("hey jarvis", "ok google", "alexa")
- 🗣️ Speech-to-text transcription
- 🌍 Multiple language support
- 🚀 GPU acceleration support
- 📝 Event handling and logging

### 3. Claude Desktop Setup (macOS)
```bash
# Make script executable
chmod +x extra/claude-desktop-macos-setup.sh

# Run setup
./extra/claude-desktop-macos-setup.sh
```

Features:
- 🖥️ Automated Claude Desktop installation
- ⚙️ Environment configuration
- 🔗 MCP integration setup
- 🚀 Performance optimization

## Home Assistant Analyzer Details 📊

### Analysis Categories

1. **System Overview**
   - Current state assessment
   - Health check
   - Configuration review
   - Integration status
   - Issue detection

2. **Performance Analysis**
   - Resource usage monitoring
   - Response time analysis
   - Optimization opportunities
   - Bottleneck detection

3. **Security Assessment**
   - Current security measures
   - Vulnerability detection
   - Security recommendations
   - Best practices review

4. **Optimization Suggestions**
   - Performance improvements
   - Configuration optimizations
   - Integration enhancements
   - Automation opportunities

5. **Maintenance Tasks**
   - Required updates
   - Cleanup recommendations
   - Regular maintenance tasks
   - System health checks

6. **Entity Usage Analysis**
   - Most active entities
   - Rarely used entities
   - Potential duplicates
   - Usage patterns

7. **Automation Analysis**
   - Inefficient automations
   - Improvement suggestions
   - Blueprint recommendations
   - Condition optimizations

8. **Energy Management**
   - High consumption detection
   - Monitoring suggestions
   - Tariff optimization
   - Usage patterns

### Configuration

```yaml
# config/analyzer.yaml
analysis:
  depth: detailed    # quick, basic, or detailed
  models:           # AI models to use
    - gpt-4         # for complex analysis
    - gpt-3.5-turbo # for quick checks
  focus:            # Analysis focus areas
    - security
    - performance
    - automations
    - energy
  ignore:           # Paths to ignore
    - test/
    - disabled/
```

## Speech-to-Text Integration 🎤

### Prerequisites
1. Docker installed and running
2. NVIDIA GPU with CUDA (optional, for faster processing)
3. Audio input device configured

### Configuration
```yaml
# speech-config.yaml
wake_word:
  enabled: true
  words:
    - "hey jarvis"
    - "ok google"
    - "alexa"
  sensitivity: 0.5

speech_to_text:
  model: "base"     # tiny, base, small, medium, large
  language: "en"    # en, es, fr, etc.
  use_gpu: true     # Enable GPU acceleration
```

### Usage Example
```typescript
import { SpeechProcessor } from './speech-to-text-example';

const processor = new SpeechProcessor({
  wakeWord: true,
  model: 'base',
  language: 'en'
});

processor.on('wake_word', (timestamp) => {
  console.log('Wake word detected!');
});

processor.on('transcription', (text) => {
  console.log('Transcribed:', text);
});

await processor.start();
```

## Best Practices 🎯

1. **Analysis Tool Usage**
   - Run regular system analyses
   - Focus on specific areas when needed
   - Review and implement suggestions
   - Monitor improvements

2. **Speech Processing**
   - Choose appropriate models
   - Test in your environment
   - Adjust sensitivity as needed
   - Monitor performance

3. **Integration Setup**
   - Follow security best practices
   - Test in development first
   - Monitor resource usage
   - Keep configurations updated

## Troubleshooting 🔧

### Common Issues

1. **Analyzer CLI Issues**
   - Verify API keys
   - Check network connectivity
   - Validate YAML syntax
   - Review permissions

2. **Speech Processing Issues**
   - Check audio device
   - Verify Docker setup
   - Monitor GPU usage
   - Check model compatibility

3. **Integration Issues**
   - Verify configurations
   - Check dependencies
   - Review logs
   - Test connectivity

## API Reference 🔌

### Analyzer API
```typescript
import { HomeAssistantAnalyzer } from './ha-analyzer-cli';

const analyzer = new HomeAssistantAnalyzer({
  depth: 'detailed',
  focus: ['security', 'performance']
});

const analysis = await analyzer.analyze();
console.log(analysis.suggestions);
```

See [API Documentation](api.md) for more details. 