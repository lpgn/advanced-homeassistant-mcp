# Speech-to-Text Examples

This directory contains examples demonstrating how to use the speech-to-text integration with wake word detection.

## Prerequisites

1. Make sure you have Docker installed and running
2. Build and start the services:
   ```bash
   docker-compose up -d
   ```

## Running the Example

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the example:
   ```bash
   npm run example:speech
   ```

   Or using `ts-node` directly:
   ```bash
   npx ts-node examples/speech-to-text-example.ts
   ```

## Features Demonstrated

1. **Wake Word Detection**
   - Listens for wake words: "hey jarvis", "ok google", "alexa"
   - Automatically saves audio when wake word is detected
   - Transcribes the detected speech

2. **Manual Transcription**
   - Example of how to transcribe audio files manually
   - Supports different models and configurations

3. **Event Handling**
   - Wake word detection events
   - Transcription results
   - Progress updates
   - Error handling

## Example Output

When a wake word is detected, you'll see output like this:

```
🎤 Wake word detected!
  Timestamp: 20240203_123456
  Audio file: /path/to/audio/wake_word_20240203_123456.wav
  Metadata file: /path/to/audio/wake_word_20240203_123456.wav.json

📝 Transcription result:
  Full text: This is what was said after the wake word.

  Segments:
    1. [0.00s - 1.52s] (95.5% confidence)
       "This is what was said"
    2. [1.52s - 2.34s] (98.2% confidence)
       "after the wake word."
```

## Customization

You can customize the behavior by:

1. Changing the wake word models in `docker/speech/Dockerfile`
2. Modifying transcription options in the example file
3. Adding your own event handlers
4. Implementing different audio processing logic

## Troubleshooting

1. **Docker Issues**
   - Make sure Docker is running
   - Check container logs: `docker-compose logs fast-whisper`
   - Verify container is up: `docker ps`

2. **Audio Issues**
   - Check audio device permissions
   - Verify audio file format (WAV files recommended)
   - Check audio file permissions

3. **Performance Issues**
   - Try using a smaller model (tiny.en or base.en)
   - Adjust beam size and patience parameters
   - Consider using GPU acceleration if available 