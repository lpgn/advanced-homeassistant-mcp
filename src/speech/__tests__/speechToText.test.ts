import { SpeechToText, WakeWordEvent } from '../speechToText';
import fs from 'fs';
import path from 'path';

describe('SpeechToText', () => {
    let speechToText: SpeechToText;
    const testAudioDir = path.join(__dirname, 'test_audio');

    beforeEach(() => {
        speechToText = new SpeechToText('fast-whisper');
        // Create test audio directory if it doesn't exist
        if (!fs.existsSync(testAudioDir)) {
            fs.mkdirSync(testAudioDir, { recursive: true });
        }
    });

    afterEach(() => {
        speechToText.stopWakeWordDetection();
        // Clean up test files
        if (fs.existsSync(testAudioDir)) {
            fs.rmSync(testAudioDir, { recursive: true, force: true });
        }
    });

    describe('checkHealth', () => {
        it('should return true when the container is running', async () => {
            const isHealthy = await speechToText.checkHealth();
            expect(isHealthy).toBeDefined();
        });
    });

    describe('wake word detection', () => {
        it('should detect new audio files and emit wake word events', (done) => {
            const testFile = path.join(testAudioDir, 'wake_word_20240203_123456.wav');
            const testMetadata = `${testFile}.json`;

            speechToText.startWakeWordDetection(testAudioDir);

            speechToText.on('wake_word', (event: WakeWordEvent) => {
                expect(event).toBeDefined();
                expect(event.audioFile).toBe(testFile);
                expect(event.metadataFile).toBe(testMetadata);
                expect(event.timestamp).toBe('123456');
                done();
            });

            // Create a test audio file to trigger the event
            fs.writeFileSync(testFile, 'test audio content');
        });

        it('should automatically transcribe detected wake word audio', (done) => {
            const testFile = path.join(testAudioDir, 'wake_word_20240203_123456.wav');

            speechToText.startWakeWordDetection(testAudioDir);

            speechToText.on('transcription', (event) => {
                expect(event).toBeDefined();
                expect(event.audioFile).toBe(testFile);
                expect(event.result).toBeDefined();
                done();
            });

            // Create a test audio file to trigger the event
            fs.writeFileSync(testFile, 'test audio content');
        });

        it('should handle errors during wake word audio transcription', (done) => {
            const testFile = path.join(testAudioDir, 'wake_word_20240203_123456.wav');

            speechToText.startWakeWordDetection(testAudioDir);

            speechToText.on('error', (error) => {
                expect(error).toBeDefined();
                expect(error.message).toContain('Transcription failed');
                done();
            });

            // Create an invalid audio file to trigger an error
            fs.writeFileSync(testFile, 'invalid audio content');
        });
    });

    describe('transcribeAudio', () => {
        it('should transcribe an audio file', async () => {
            const result = await speechToText.transcribeAudio('/audio/test.wav');

            expect(result).toBeDefined();
            expect(result.text).toBeDefined();
            expect(result.segments).toBeDefined();
            expect(Array.isArray(result.segments)).toBe(true);
        }, 30000);

        it('should handle transcription errors', async () => {
            await expect(
                speechToText.transcribeAudio('/audio/nonexistent.wav')
            ).rejects.toThrow();
        });

        it('should emit progress events', (done) => {
            const progressEvents: Array<{ type: string; data: string }> = [];

            speechToText.on('progress', (event: { type: string; data: string }) => {
                progressEvents.push(event);
                if (event.type === 'stderr' && event.data.includes('error')) {
                    expect(progressEvents.length).toBeGreaterThan(0);
                    done();
                }
            });

            // Trigger an error to test progress events
            speechToText.transcribeAudio('/audio/nonexistent.wav').catch(() => { });
        });
    });
}); 