import { describe, expect, test, beforeEach, afterEach, mock, spyOn } from "bun:test";
import type { Mock } from "bun:test";
import { EventEmitter } from "events";
import { SpeechToText, TranscriptionError, type TranscriptionOptions } from "../../src/speech/speechToText";
import type { SpeechToTextConfig } from "../../src/speech/types";
import type { ChildProcess } from "child_process";

interface MockProcess extends EventEmitter {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: Mock<() => void>;
}

type SpawnFn = {
    (cmds: string[], options?: Record<string, unknown>): ChildProcess;
};

describe('SpeechToText', () => {
    let spawnMock: Mock<SpawnFn>;
    let mockProcess: MockProcess;
    let speechToText: SpeechToText;

    beforeEach(() => {
        // Create mock process
        mockProcess = new EventEmitter() as MockProcess;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.kill = mock(() => { });

        // Create spawn mock
        spawnMock = mock((cmds: string[], options?: Record<string, unknown>) => mockProcess as unknown as ChildProcess);
        (globalThis as any).Bun = { spawn: spawnMock };

        // Initialize SpeechToText
        const config: SpeechToTextConfig = {
            modelPath: '/test/model',
            modelType: 'base.en',
            containerName: 'test-container'
        };
        speechToText = new SpeechToText(config);
    });

    afterEach(() => {
        // Cleanup
        mockProcess.removeAllListeners();
        mockProcess.stdout.removeAllListeners();
        mockProcess.stderr.removeAllListeners();
    });

    describe('Initialization', () => {
        test('should create instance with default config', () => {
            const config: SpeechToTextConfig = {
                modelPath: '/test/model',
                modelType: 'base.en'
            };
            const instance = new SpeechToText(config);
            expect(instance).toBeDefined();
        });

        test('should initialize successfully', async () => {
            const result = await speechToText.initialize();
            expect(result).toBeUndefined();
        });

        test('should not initialize twice', async () => {
            await speechToText.initialize();
            const result = await speechToText.initialize();
            expect(result).toBeUndefined();
        });
    });

    describe('Health Check', () => {
        test('should return true when Docker container is running', async () => {
            // Setup mock process
            setTimeout(() => {
                mockProcess.stdout.emit('data', Buffer.from('Up 2 hours'));
            }, 0);

            const result = await speechToText.checkHealth();
            expect(result).toBe(true);
        });

        test('should return false when Docker container is not running', async () => {
            // Setup mock process
            setTimeout(() => {
                mockProcess.stdout.emit('data', Buffer.from('No containers found'));
            }, 0);

            const result = await speechToText.checkHealth();
            expect(result).toBe(false);
        });

        test('should handle Docker command errors', async () => {
            // Setup mock process
            setTimeout(() => {
                mockProcess.stderr.emit('data', Buffer.from('Docker error'));
            }, 0);

            const result = await speechToText.checkHealth();
            expect(result).toBe(false);
        });
    });

    describe('Wake Word Detection', () => {
        test('should detect wake word and emit event', async () => {
            // Setup mock process
            setTimeout(() => {
                mockProcess.stdout.emit('data', Buffer.from('Wake word detected'));
            }, 0);

            const wakeWordPromise = new Promise<void>((resolve) => {
                speechToText.on('wake_word', () => {
                    resolve();
                });
            });

            speechToText.startWakeWordDetection();
            await wakeWordPromise;
        });

        test('should handle non-wake-word files', async () => {
            // Setup mock process
            setTimeout(() => {
                mockProcess.stdout.emit('data', Buffer.from('Processing audio'));
            }, 0);

            const wakeWordPromise = new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    resolve();
                }, 100);

                speechToText.on('wake_word', () => {
                    clearTimeout(timeout);
                    reject(new Error('Wake word should not be detected'));
                });
            });

            speechToText.startWakeWordDetection();
            await wakeWordPromise;
        });
    });

    describe('Audio Transcription', () => {
        const mockTranscriptionResult = {
            text: 'Test transcription',
            segments: [{
                text: 'Test transcription',
                start: 0,
                end: 1,
                confidence: 0.95
            }]
        };

        test('should transcribe audio successfully', async () => {
            // Setup mock process
            setTimeout(() => {
                mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(mockTranscriptionResult)));
            }, 0);

            const result = await speechToText.transcribeAudio('/test/audio.wav');
            expect(result).toEqual(mockTranscriptionResult);
        });

        test('should handle transcription errors', async () => {
            // Setup mock process
            setTimeout(() => {
                mockProcess.stderr.emit('data', Buffer.from('Transcription failed'));
            }, 0);

            await expect(speechToText.transcribeAudio('/test/audio.wav')).rejects.toThrow(TranscriptionError);
        });

        test('should handle invalid JSON output', async () => {
            // Setup mock process
            setTimeout(() => {
                mockProcess.stdout.emit('data', Buffer.from('Invalid JSON'));
            }, 0);

            await expect(speechToText.transcribeAudio('/test/audio.wav')).rejects.toThrow(TranscriptionError);
        });

        test('should pass correct transcription options', async () => {
            const options: TranscriptionOptions = {
                model: 'base.en',
                language: 'en',
                temperature: 0,
                beamSize: 5,
                patience: 1,
                device: 'cpu'
            };

            await speechToText.transcribeAudio('/test/audio.wav', options);

            const spawnArgs = spawnMock.mock.calls[0]?.args[1] || [];
            expect(spawnArgs).toContain('--model');
            expect(spawnArgs).toContain(options.model);
            expect(spawnArgs).toContain('--language');
            expect(spawnArgs).toContain(options.language);
            expect(spawnArgs).toContain('--temperature');
            expect(spawnArgs).toContain(options.temperature?.toString());
            expect(spawnArgs).toContain('--beam-size');
            expect(spawnArgs).toContain(options.beamSize?.toString());
            expect(spawnArgs).toContain('--patience');
            expect(spawnArgs).toContain(options.patience?.toString());
            expect(spawnArgs).toContain('--device');
            expect(spawnArgs).toContain(options.device);
        });
    });

    describe('Event Handling', () => {
        test('should emit progress events', async () => {
            const progressPromise = new Promise<void>((resolve) => {
                speechToText.on('progress', (progress) => {
                    expect(progress).toEqual({ type: 'stdout', data: 'Processing' });
                    resolve();
                });
            });

            const transcribePromise = speechToText.transcribeAudio('/test/audio.wav');
            mockProcess.stdout.emit('data', Buffer.from('Processing'));
            await Promise.all([transcribePromise.catch(() => { }), progressPromise]);
        });

        test('should emit error events', async () => {
            const errorPromise = new Promise<void>((resolve) => {
                speechToText.on('error', (error) => {
                    expect(error instanceof Error).toBe(true);
                    expect(error.message).toBe('Test error');
                    resolve();
                });
            });

            speechToText.emit('error', new Error('Test error'));
            await errorPromise;
        });
    });

    describe('Cleanup', () => {
        test('should stop wake word detection', () => {
            speechToText.startWakeWordDetection();
            speechToText.stopWakeWordDetection();
            expect(mockProcess.kill.mock.calls.length).toBe(1);
        });

        test('should clean up resources on shutdown', async () => {
            await speechToText.initialize();
            await speechToText.shutdown();
            expect(mockProcess.kill.mock.calls.length).toBe(1);
        });
    });
}); 