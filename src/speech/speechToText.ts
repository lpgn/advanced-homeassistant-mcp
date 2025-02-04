import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { watch } from 'fs';
import path from 'path';

export interface TranscriptionOptions {
    model?: 'tiny.en' | 'base.en' | 'small.en' | 'medium.en' | 'large-v2';
    language?: string;
    temperature?: number;
    beamSize?: number;
    patience?: number;
    device?: 'cpu' | 'cuda';
}

export interface TranscriptionResult {
    text: string;
    segments: Array<{
        text: string;
        start: number;
        end: number;
        confidence: number;
    }>;
}

export interface WakeWordEvent {
    timestamp: string;
    audioFile: string;
    metadataFile: string;
}

export class TranscriptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TranscriptionError';
    }
}

export class SpeechToText extends EventEmitter {
    private containerName: string;
    private audioWatcher?: ReturnType<typeof watch>;

    constructor(containerName = 'fast-whisper') {
        super();
        this.containerName = containerName;
    }

    startWakeWordDetection(audioDir: string = './audio'): void {
        // Watch for new audio files from wake word detection
        this.audioWatcher = watch(audioDir, (eventType, filename) => {
            if (eventType === 'rename' && filename && filename.startsWith('wake_word_') && filename.endsWith('.wav')) {
                const audioFile = path.join(audioDir, filename);
                const metadataFile = `${audioFile}.json`;

                // Emit wake word event
                this.emit('wake_word', {
                    timestamp: filename.split('_')[2].split('.')[0],
                    audioFile,
                    metadataFile
                } as WakeWordEvent);

                // Automatically transcribe the wake word audio
                this.transcribeAudio(audioFile)
                    .then(result => {
                        this.emit('transcription', { audioFile, result });
                    })
                    .catch(error => {
                        this.emit('error', error);
                    });
            }
        });
    }

    stopWakeWordDetection(): void {
        if (this.audioWatcher) {
            this.audioWatcher.close();
            this.audioWatcher = undefined;
        }
    }

    async transcribeAudio(
        audioFilePath: string,
        options: TranscriptionOptions = {}
    ): Promise<TranscriptionResult> {
        const {
            model = 'base.en',
            language = 'en',
            temperature = 0,
            beamSize = 5,
            patience = 1,
            device = 'cpu'
        } = options;

        return new Promise((resolve, reject) => {
            // Construct Docker command to run fast-whisper
            const args = [
                'exec',
                this.containerName,
                'fast-whisper',
                '--model', model,
                '--language', language,
                '--temperature', temperature.toString(),
                '--beam-size', beamSize.toString(),
                '--patience', patience.toString(),
                '--device', device,
                '--output-json',
                audioFilePath
            ];

            const process = spawn('docker', args);
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
                this.emit('progress', { type: 'stdout', data: data.toString() });
            });

            process.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
                this.emit('progress', { type: 'stderr', data: data.toString() });
            });

            process.on('close', (code: number) => {
                if (code !== 0) {
                    reject(new TranscriptionError(`Transcription failed: ${stderr}`));
                    return;
                }

                try {
                    const result = JSON.parse(stdout) as TranscriptionResult;
                    resolve(result);
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        reject(new TranscriptionError(`Failed to parse transcription result: ${error.message}`));
                    } else {
                        reject(new TranscriptionError('Failed to parse transcription result: Unknown error'));
                    }
                }
            });
        });
    }

    async checkHealth(): Promise<boolean> {
        try {
            const process = spawn('docker', ['ps', '--filter', `name=${this.containerName}`, '--format', '{{.Status}}']);

            return new Promise((resolve) => {
                let output = '';
                process.stdout.on('data', (data: Buffer) => {
                    output += data.toString();
                });

                process.on('close', (code: number) => {
                    resolve(code === 0 && output.toLowerCase().includes('up'));
                });
            });
        } catch (error) {
            return false;
        }
    }
} 