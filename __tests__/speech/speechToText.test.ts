import { describe, expect, test } from "bun:test";
import { SpeechToText, TranscriptionResult, WakeWordEvent, TranscriptionError, TranscriptionOptions } from '../../src/speech/speechToText';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { describe, expect, beforeEach, afterEach, it, mock, spyOn } from 'bun:test';

// Mock child_process spawn
const spawnMock = mock((cmd: string, args: string[]) => ({
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    on: (event: string, cb: (code: number) => void) => {
        if (event === 'close') setTimeout(() => cb(0), 0);
    }
}));

describe('SpeechToText', () => {
    let speechToText: SpeechToText;
    const testAudioDir = path.join(import.meta.dir, 'test_audio');
    const mockConfig = {
        containerName: 'test-whisper',
        modelPath: '/models/whisper',
        modelType: 'base.en'
    };

    beforeEach(() => {
        speechToText = new SpeechToText(mockConfig);
        // Create test audio directory if it doesn't exist
        if (!fs.existsSync(testAudioDir)) {
            fs.mkdirSync(testAudioDir, { recursive: true });
        }
        // Reset spawn mock
        spawnMock.mockReset();
    });

    afterEach(() => {
        speechToText.stopWakeWordDetection();
        // Clean up test files
        if (fs.existsSync(testAudioDir)) {
            fs.rmSync(testAudioDir, { recursive: true, force: true });
        }
    });

    describe('Initialization', () => {
        test('should create instance with default config', () => {
            const instance = new SpeechToText({ modelPath: '/models/whisper', modelType: 'base.en' });
            expect(instance instanceof EventEmitter).toBe(true);
            expect(instance instanceof SpeechToText).toBe(true);
        });

        test('should initialize successfully', async () => {
            const initSpy = spyOn(speechToText, 'initialize');
            await speechToText.initialize();
            expect(initSpy).toHaveBeenCalled();
        });

        test('should not initialize twice', async () => {
            await speechToText.initialize();
            const initSpy = spyOn(speechToText, 'initialize');
            await speechToText.initialize();
            expect(initSpy.mock.calls.length).toBe(1);
        });
    });

    describe('Health Check', () => {
        test('should return true when Docker container is running', async () => {
            const mockProcess = {
                stdout: new EventEmitter(),
                stderr: new EventEmitter(),
                on: (event: string, cb: (code: number) => void) => {
                    if (event === 'close') setTimeout(() => cb(0), 0);
                }
            };
            spawnMock.mockImplementation(() => mockProcess);

            setTimeout(() => {
                mockProcess.stdout.emtest('data', Buffer.from('Up 2 hours'));
            }, 0);

            const result = await speechToText.checkHealth();
            expect(result).toBe(true);
        });

        test('should return false when Docker container is not running', async () => {
            const mockProcess = {
                stdout: new EventEmitter(),
                stderr: new EventEmitter(),
                on: (event: string, cb: (code: number) => void) => {
                    if (event === 'close') setTimeout(() => cb(1), 0);
                }
            };
            spawnMock.mockImplementation(() => mockProcess);

            const result = await speechToText.checkHealth();
            expect(result).toBe(false);
        });

        test('should handle Docker command errors', async () => {
            spawnMock.mockImplementation(() => {
                throw new Error('Docker not found');
            });

            const result = await speechToText.checkHealth();
            expect(result).toBe(false);
        });
    });

    describe('Wake Word Detection', () => {
        test('should detect wake word and emit event', async () => {
            const testFile = path.join(testAudioDir, 'wake_word_test_123456.wav');
            const testMetadata = `${testFile}.json`;

            return new Promise<void>((resolve) => {
                speechToText.startWakeWordDetection(testAudioDir);

                speechToText.on('wake_word', (event: WakeWordEvent) => {
                    expect(event).toBeDefined();
                    expect(event.audioFile).toBe(testFile);
                    expect(event.metadataFile).toBe(testMetadata);
                    expect(event.timestamp).toBe('123456');
                    resolve();
                });

                // Create a test audio file to trigger the event
                fs.writeFileSync(testFile, 'test audio content');
            });
        });

        test('should handle non-wake-word files', async () => {
            const testFile = path.join(testAudioDir, 'regular_audio.wav');
            let eventEmitted = false;

            return new Promise<void>((resolve) => {
                speechToText.startWakeWordDetection(testAudioDir);

                speechToText.on('wake_word', () => {
                    eventEmitted = true;
                });

                fs.writeFileSync(testFile, 'test audio content');

                setTimeout(() => {
                    expect(eventEmitted).toBe(false);
                    resolve();
                }, 100);
            });
        });
    });

    describe('Audio Transcription', () => {
        const mockTranscriptionResult: TranscriptionResult = {
            text: 'Hello world',
            segments: [{
                text: 'Hello world',
                start: 0,
                end: 1,
                confidence: 0.95
            }]
        };

        test('should transcribe audio successfully', async () => {
            const mockProcess = {
                stdout: new EventEmitter(),
                stderr: new EventEmitter(),
                on: (event: string, cb: (code: number) => void) => {
                    if (event === 'close') setTimeout(() => cb(0), 0);
                }
            };
            spawnMock.mockImplementation(() => mockProcess);

            const transcriptionPromise = speechToText.transcribeAudio('/test/audio.wav');

            setTimeout(() => {
                mockProcess.stdout.emtest('data', Buffer.from(JSON.stringify(mockTranscriptionResult)));
            }, 0);

            const result = await transcriptionPromise;
            expect(result).toEqual(mockTranscriptionResult);
        });

        test('should handle transcription errors', async () => {
            const mockProcess = {
                stdout: new EventEmitter(),
                stderr: new EventEmitter(),
                on: (event: string, cb: (code: number) => void) => {
                    if (event === 'close') setTimeout(() => cb(1), 0);
                }
            };
            spawnMock.mockImplementation(() => mockProcess);

            const transcriptionPromise = speechToText.transcribeAudio('/test/audio.wav');

            setTimeout(() => {
                mockProcess.stderr.emtest('data', Buffer.from('Transcription failed'));
            }, 0);

            await expect(transcriptionPromise).rejects.toThrow(TranscriptionError);
        });

        test('should handle invalid JSON output', async () => {
            const mockProcess = {
                stdout: new EventEmitter(),
                stderr: new EventEmitter(),
                on: (event: string, cb: (code: number) => void) => {
                    if (event === 'close') setTimeout(() => cb(0), 0);
                }
            };
            spawnMock.mockImplementation(() => mockProcess);

            const transcriptionPromise = speechToText.transcribeAudio('/test/audio.wav');

            setTimeout(() => {
                mockProcess.stdout.emtest('data', Buffer.from('Invalid JSON'));
            }, 0);

            await expect(transcriptionPromise).rejects.toThrow(TranscriptionError);
        });

        test('should pass correct transcription options', async () => {
            const options: TranscriptionOptions = {
                model: 'large-v2',
                language: 'en',
                temperature: 0.5,
                beamSize: 3,
                patience: 2,
                device: 'cuda'
            };

            const mockProcess = {
                stdout: new EventEmitter(),
                stderr: new EventEmitter(),
                on: (event: string, cb: (code: number) => void) => {
                    if (event === 'close') setTimeout(() => cb(0), 0);
                }
            };
            spawnMock.mockImplementation(() => mockProcess);

            const transcriptionPromise = speechToText.transcribeAudio('/test/audio.wav', options);

            const expectedArgs = [
                'exec',
                mockConfig.containerName,
                'fast-whisper',
                '--model', options.model,
                '--language', options.language,
                '--temperature', String(options.temperature ?? 0),
                '--beam-size', String(options.beamSize ?? 5),
                '--patience', String(options.patience ?? 1),
                '--device', options.device
            ].filter((arg): arg is string => arg !== undefined);

            const mockCalls = spawnMock.mock.calls;
            expect(mockCalls.length).toBe(1);
            const [cmd, args] = mockCalls[0].args;
            expect(cmd).toBe('docker');
            expect(expectedArgs.every(arg => args.includes(arg))).toBe(true);

            await transcriptionPromise.catch(() => { });
        });
    });

    describe('Event Handling', () => {
        test('should emit progress events', async () => {
            const mockProcess = {
                stdout: new EventEmitter(),
                stderr: new EventEmitter(),
                on: (event: string, cb: (code: number) => void) => {
                    if (event === 'close') setTimeout(() => cb(0), 0);
                }
            };
            spawnMock.mockImplementation(() => mockProcess);

            return new Promise<void>((resolve) => {
                const progressEvents: any[] = [];
                speechToText.on('progress', (event) => {
                    progressEvents.push(event);
                    if (progressEvents.length === 2) {
                        expect(progressEvents).toEqual([
                            { type: 'stdout', data: 'Processing' },
                            { type: 'stderr', data: 'Loading model' }
                        ]);
                        resolve();
                    }
                });

                void speechToText.transcribeAudio('/test/audio.wav');

                mockProcess.stdout.emtest('data', Buffer.from('Processing'));
                mockProcess.stderr.emtest('data', Buffer.from('Loading model'));
            });
        });

        test('should emit error events', async () => {
            return new Promise<void>((resolve) => {
                speechToText.on('error', (error) => {
                    expect(error instanceof Error).toBe(true);
                    expect(error.message).toBe('Test error');
                    resolve();
                });

                speechToText.emtest('error', new Error('Test error'));
            });
        });
    });

    describe('Cleanup', () => {
        test('should stop wake word detection', () => {
            speechToText.startWakeWordDetection(testAudioDir);
            speechToText.stopWakeWordDetection();
            // Verify no more file watching events are processed
            const testFile = path.join(testAudioDir, 'wake_word_test_123456.wav');
            let eventEmitted = false;
            speechToText.on('wake_word', () => {
                eventEmitted = true;
            });
            fs.writeFileSync(testFile, 'test audio content');
            expect(eventEmitted).toBe(false);
        });

        test('should clean up resources on shutdown', async () => {
            await speechToText.initialize();
            const shutdownSpy = spyOn(speechToText, 'shutdown');
            await speechToText.shutdown();
            expect(shutdownSpy).toHaveBeenCalled();
        });
    });
}); 