# Speech Features

The Home Assistant MCP Server includes powerful speech processing capabilities powered by fast-whisper and custom wake word detection. This guide explains how to set up and use these features effectively.

## Overview

The speech processing system consists of two main components:
1. Wake Word Detection - Listens for specific trigger phrases
2. Speech-to-Text - Transcribes spoken commands using fast-whisper

## Setup

### Prerequisites

1. Docker environment:
```bash
docker --version  # Should be 20.10.0 or higher
```

2. For GPU acceleration:
- NVIDIA GPU with CUDA support
- NVIDIA Container Toolkit installed
- NVIDIA drivers 450.80.02 or higher

### Installation

1. Enable speech features in your `.env`:
```bash
ENABLE_SPEECH_FEATURES=true
ENABLE_WAKE_WORD=true
ENABLE_SPEECH_TO_TEXT=true
```

2. Configure model settings:
```bash
WHISPER_MODEL_PATH=/models
WHISPER_MODEL_TYPE=base
WHISPER_LANGUAGE=en
WHISPER_TASK=transcribe
WHISPER_DEVICE=cuda  # or cpu
```

3. Start the services:
```bash
docker-compose up -d
```

## Usage

### Wake Word Detection

The wake word detector continuously listens for configured trigger phrases. Default wake words:
- "hey jarvis"
- "ok google"
- "alexa"

Custom wake words can be configured:
```bash
WAKE_WORDS=computer,jarvis,assistant
```

When a wake word is detected:
1. The system starts recording audio
2. Audio is processed through the speech-to-text pipeline
3. The resulting command is processed by the server

### Speech-to-Text

#### Automatic Transcription

After wake word detection:
1. Audio is automatically captured (default: 5 seconds)
2. The audio is transcribed using the configured whisper model
3. The transcribed text is processed as a command

#### Manual Transcription

You can also manually transcribe audio using the API:

```typescript
// Using the TypeScript client
import { SpeechService } from '@ha-mcp/client';

const speech = new SpeechService();

// Transcribe from audio buffer
const buffer = await getAudioBuffer();
const text = await speech.transcribe(buffer);

// Transcribe from file
const text = await speech.transcribeFile('command.wav');
```

```javascript
// Using the REST API
POST /api/speech/transcribe
Content-Type: multipart/form-data

file: <audio file>
```

### Event Handling

The system emits various events during speech processing:

```typescript
speech.on('wakeWord', (word: string) => {
  console.log(`Wake word detected: ${word}`);
});

speech.on('listening', () => {
  console.log('Listening for command...');
});

speech.on('transcribing', () => {
  console.log('Processing speech...');
});

speech.on('transcribed', (text: string) => {
  console.log(`Transcribed text: ${text}`);
});

speech.on('error', (error: Error) => {
  console.error('Speech processing error:', error);
});
```

## Performance Optimization

### Model Selection

Choose an appropriate model based on your needs:

1. Resource-constrained environments:
   - Use `tiny.en` or `base.en`
   - Run on CPU if GPU unavailable
   - Limit concurrent processing

2. High-accuracy requirements:
   - Use `small.en` or `medium.en`
   - Enable GPU acceleration
   - Increase audio quality

3. Production environments:
   - Use `base.en` or `small.en`
   - Enable GPU acceleration
   - Configure appropriate timeouts

### GPU Acceleration

When using GPU acceleration:

1. Monitor GPU memory usage:
```bash
nvidia-smi -l 1
```

2. Adjust model size if needed:
```bash
WHISPER_MODEL_TYPE=small  # Decrease if GPU memory limited
```

3. Configure processing device:
```bash
WHISPER_DEVICE=cuda      # Use GPU
WHISPER_DEVICE=cpu      # Use CPU if GPU unavailable
```

## Troubleshooting

### Common Issues

1. Wake word detection not working:
   - Check microphone permissions
   - Adjust `WAKE_WORD_SENSITIVITY`
   - Verify wake words configuration

2. Poor transcription quality:
   - Check audio input quality
   - Try a larger model
   - Verify language settings

3. Performance issues:
   - Monitor resource usage
   - Consider smaller model
   - Check GPU acceleration status

### Logging

Enable debug logging for detailed information:
```bash
LOG_LEVEL=debug
```

Speech-specific logs will be tagged with `[SPEECH]` prefix.

## Security Considerations

1. Audio Privacy:
   - Audio is processed locally
   - No data sent to external services
   - Temporary files automatically cleaned

2. Access Control:
   - Speech endpoints require authentication
   - Rate limiting applies to transcription
   - Configurable command restrictions

3. Resource Protection:
   - Timeouts prevent hanging
   - Memory limits enforced
   - Graceful error handling 