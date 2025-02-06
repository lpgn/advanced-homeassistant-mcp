# Custom Prompts Guide 🎯

## Overview

Custom prompts allow you to tailor the AI's behavior to your specific needs. I've designed this system to be flexible and powerful, enabling everything from simple commands to complex automation analysis.

## Prompt Structure 📝

Custom prompts are defined in YAML format:

```yaml
name: prompt_name
description: Brief description of what this prompt does
version: 1.0
author: your_name
tags: [automation, analysis, security]
models: [gpt-4, claude-2]  # Compatible models
prompt: |
  Your detailed prompt text here.
  You can use {variables} for dynamic content.
  
  Context: {context}
  Data: {data}
  
variables:
  - name: context
    type: object
    description: Contextual information
    required: true
  - name: data
    type: array
    description: Data to analyze
    required: true
```

## Prompt Types 🎨

### 1. Analysis Prompts
```yaml
name: automation_analysis
description: Analyze Home Assistant automations
prompt: |
  Analyze the following Home Assistant automation:
  {automation_yaml}
  
  Provide:
  1. Security implications
  2. Performance considerations
  3. Potential improvements
  4. Error handling suggestions
```

### 2. Command Prompts
```yaml
name: natural_command
description: Process natural language commands
prompt: |
  Convert the following natural language command into Home Assistant actions:
  "{command}"
  
  Available devices: {devices}
  Current state: {state}
```

### 3. Query Prompts
```yaml
name: state_query
description: Answer questions about system state
prompt: |
  Answer the following question about the system state:
  "{question}"
  
  Current states:
  {states}
  
  Historical data:
  {history}
```

## Variables and Context 🔄

### Built-in Variables
- `{timestamp}` - Current time
- `{user}` - Current user
- `{device_states}` - All device states
- `{last_events}` - Recent events
- `{system_info}` - System information

### Custom Variables
```yaml
variables:
  - name: temperature_threshold
    type: number
    default: 25
    description: Temperature threshold for alerts
  
  - name: devices
    type: array
    required: true
    description: List of relevant devices
```

## Creating Custom Prompts 🛠️

1. Create a new file in `prompts/custom/`:
```bash
bun run create-prompt my_prompt
```

2. Edit the generated template:
```yaml
name: my_custom_prompt
description: My custom prompt for specific tasks
version: 1.0
author: your_name
prompt: |
  Your prompt text here
```

3. Test your prompt:
```bash
bun run test-prompt my_custom_prompt
```

## Advanced Features 🚀

### 1. Prompt Chaining
```yaml
name: complex_analysis
chain:
  - automation_analysis
  - security_check
  - optimization_suggestions
```

### 2. Conditional Prompts
```yaml
name: adaptive_response
conditions:
  - if: "temperature > 25"
    use: high_temp_prompt
  - if: "temperature < 10"
    use: low_temp_prompt
  - else: normal_temp_prompt
```

### 3. Dynamic Templates
```yaml
name: dynamic_template
template: |
  {% if time.hour < 12 %}
    Good morning! Here's the morning analysis:
  {% else %}
    Good evening! Here's the evening analysis:
  {% endif %}
  
  {analysis_content}
```

## Best Practices 🎯

1. **Prompt Design**
   - Be specific and clear
   - Include examples
   - Use consistent formatting
   - Consider edge cases

2. **Variable Usage**
   - Define clear variable types
   - Provide defaults when possible
   - Document requirements
   - Validate inputs

3. **Performance**
   - Keep prompts concise
   - Use appropriate models
   - Cache when possible
   - Consider token limits

4. **Maintenance**
   - Version your prompts
   - Document changes
   - Test thoroughly
   - Share improvements

## Examples 📚

### Home Security Analysis
```yaml
name: security_analysis
description: Analyze home security status
prompt: |
  Analyze the current security status:
  
  Doors: {door_states}
  Windows: {window_states}
  Cameras: {camera_states}
  Motion Sensors: {motion_states}
  
  Recent Events:
  {recent_events}
  
  Provide:
  1. Current security status
  2. Potential vulnerabilities
  3. Recommended actions
  4. Automation suggestions
```

### Energy Optimization
```yaml
name: energy_optimization
description: Analyze and optimize energy usage
prompt: |
  Review energy consumption patterns:
  
  Usage Data: {energy_data}
  Device States: {device_states}
  Weather: {weather_data}
  
  Provide:
  1. Usage patterns
  2. Inefficiencies
  3. Optimization suggestions
  4. Estimated savings
```

## Troubleshooting 🔧

### Common Issues

1. **Prompt Not Working**
   - Verify YAML syntax
   - Check variable definitions
   - Validate model compatibility
   - Review token limits

2. **Poor Results**
   - Improve prompt specificity
   - Add more context
   - Try different models
   - Include examples

3. **Performance Issues**
   - Optimize prompt length
   - Review caching strategy
   - Check rate limits
   - Monitor token usage

## API Integration 🔌

```typescript
// Load a custom prompt
const prompt = await loadPrompt('my_custom_prompt');

// Execute with variables
const result = await executePrompt(prompt, {
  context: currentContext,
  data: analysisData
});
```

See [API Documentation](api.md) for more details. 