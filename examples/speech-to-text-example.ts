import { SpeechToText, TranscriptionResult, WakeWordEvent } from '../src/speech/speechToText';
import path from 'path';

async function main() {
    // Initialize the speech-to-text service
    const speech = new SpeechToText('fast-whisper');

    // Check if the service is available
    const isHealthy = await speech.checkHealth();
    if (!isHealthy) {
        console.error('Speech service is not available. Make sure Docker is running and the fast-whisper container is up.');
        console.error('Run: docker-compose up -d');
        process.exit(1);
    }

    console.log('Speech service is ready!');
    console.log('Listening for wake words: "hey jarvis", "ok google", "alexa"');
    console.log('Press Ctrl+C to exit');

    // Set up event handlers
    speech.on('wake_word', (event: WakeWordEvent) => {
        console.log('\n🎤 Wake word detected!');
        console.log('  Timestamp:', event.timestamp);
        console.log('  Audio file:', event.audioFile);
        console.log('  Metadata file:', event.metadataFile);
    });

    speech.on('transcription', (event: { audioFile: string; result: TranscriptionResult }) => {
        console.log('\n📝 Transcription result:');
        console.log('  Full text:', event.result.text);
        console.log('\n  Segments:');
        event.result.segments.forEach((segment, index) => {
            console.log(`    ${index + 1}. [${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s] (${(segment.confidence * 100).toFixed(1)}% confidence)`);
            console.log(`       "${segment.text}"`);
        });
    });

    speech.on('progress', (event: { type: string; data: string }) => {
        if (event.type === 'stderr' && !event.data.includes('Loading model')) {
            console.error('❌ Error:', event.data);
        }
    });

    speech.on('error', (error: Error) => {
        console.error('❌ Error:', error.message);
    });

    // Example of manual transcription
    async function transcribeFile(filepath: string) {
        try {
            console.log(`\n🎯 Manually transcribing: ${filepath}`);
            const result = await speech.transcribeAudio(filepath, {
                model: 'base.en',  // You can change this to tiny.en, small.en, medium.en, or large-v2
                language: 'en',
                temperature: 0,
                beamSize: 5
            });

            console.log('\n📝 Transcription result:');
            console.log('  Text:', result.text);
        } catch (error) {
            console.error('❌ Transcription failed:', error instanceof Error ? error.message : error);
        }
    }

    // Create audio directory if it doesn't exist
    const audioDir = path.join(__dirname, '..', 'audio');
    if (!require('fs').existsSync(audioDir)) {
        require('fs').mkdirSync(audioDir, { recursive: true });
    }

    // Start wake word detection
    speech.startWakeWordDetection(audioDir);

    // Example: You can also manually transcribe files
    // Uncomment the following line and replace with your audio file:
    // await transcribeFile('/path/to/your/audio.wav');

    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\nStopping speech service...');
        speech.stopWakeWordDetection();
        process.exit(0);
    });
}

// Run the example
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 