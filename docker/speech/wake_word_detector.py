import os
import json
import queue
import threading
import numpy as np
import sounddevice as sd
from openwakeword import Model
from datetime import datetime
import wave
from faster_whisper import WhisperModel

# Configuration
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 1024
BUFFER_DURATION = 30  # seconds to keep in buffer
DETECTION_THRESHOLD = 0.5

# Wake word models to use
WAKE_WORDS = ["hey_jarvis", "ok_google", "alexa"]

# Initialize the ASR model
asr_model = WhisperModel(
    model_size_or_path=os.environ.get('ASR_MODEL', 'base.en'),
    device="cpu",
    compute_type="int8",
    download_root=os.environ.get('ASR_MODEL_PATH', '/models')
)

class AudioProcessor:
    def __init__(self):
        # Initialize wake word detection model
        self.wake_word_model = Model(
            inference_framework="onnx"  # Use ONNX for better performance
        )

        # Pre-load the wake word models
        for wake_word in WAKE_WORDS:
            self.wake_word_model.add_model(wake_word)

        self.audio_buffer = queue.Queue()
        self.recording = False
        self.buffer = np.zeros(SAMPLE_RATE * BUFFER_DURATION)
        self.buffer_lock = threading.Lock()

    def audio_callback(self, indata, frames, time, status):
        """Callback for audio input"""
        if status:
            print(f"Audio callback status: {status}")
        
        # Convert to mono if necessary
        if CHANNELS > 1:
            audio_data = np.mean(indata, axis=1)
        else:
            audio_data = indata.flatten()

        # Update circular buffer
        with self.buffer_lock:
            self.buffer = np.roll(self.buffer, -len(audio_data))
            self.buffer[-len(audio_data):] = audio_data

        # Process for wake word detection
        prediction = self.wake_word_model.predict(audio_data)
        
        # Check if wake word detected
        for wake_word in WAKE_WORDS:
            if prediction[wake_word] > DETECTION_THRESHOLD:
                print(f"Wake word detected: {wake_word} (confidence: {prediction[wake_word]:.2f})")
                self.save_audio_segment(wake_word)
                break

    def save_audio_segment(self, wake_word):
        """Save the audio buffer when wake word is detected"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"/audio/wake_word_{wake_word}_{timestamp}.wav"
        
        # Save the audio buffer to a WAV file
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit audio
            wf.setframerate(SAMPLE_RATE)
            
            # Convert float32 to int16
            audio_data = (self.buffer * 32767).astype(np.int16)
            wf.writeframes(audio_data.tobytes())
        
        print(f"Saved audio segment to {filename}")

        # Transcribe the audio
        try:
            segments, info = asr_model.transcribe(
                filename,
                language="en",
                beam_size=5,
                temperature=0
            )
            
            # Format the transcription result
            result = {
                "text": " ".join(segment.text for segment in segments),
                "segments": [
                    {
                        "text": segment.text,
                        "start": segment.start,
                        "end": segment.end,
                        "confidence": segment.confidence
                    }
                    for segment in segments
                ]
            }
            
            # Save metadata and transcription
            metadata = {
                "timestamp": timestamp,
                "wake_word": wake_word,
                "wake_word_confidence": float(prediction[wake_word]),
                "sample_rate": SAMPLE_RATE,
                "channels": CHANNELS,
                "duration": BUFFER_DURATION,
                "transcription": result
            }
            
            with open(f"{filename}.json", 'w') as f:
                json.dump(metadata, f, indent=2)
                
            print("\nTranscription result:")
            print(f"Text: {result['text']}")
            print("\nSegments:")
            for segment in result["segments"]:
                print(f"[{segment['start']:.2f}s - {segment['end']:.2f}s] ({segment['confidence']:.2%})")
                print(f'"{segment["text"]}"')
                
        except Exception as e:
            print(f"Error during transcription: {e}")
            metadata = {
                "timestamp": timestamp,
                "wake_word": wake_word,
                "wake_word_confidence": float(prediction[wake_word]),
                "sample_rate": SAMPLE_RATE,
                "channels": CHANNELS,
                "duration": BUFFER_DURATION,
                "error": str(e)
            }
            with open(f"{filename}.json", 'w') as f:
                json.dump(metadata, f, indent=2)

    def start(self):
        """Start audio processing"""
        try:
            print("Initializing wake word detection...")
            print(f"Loaded wake words: {', '.join(WAKE_WORDS)}")
            
            with sd.InputStream(
                channels=CHANNELS,
                samplerate=SAMPLE_RATE,
                blocksize=CHUNK_SIZE,
                callback=self.audio_callback
            ):
                print("\nWake word detection started. Listening...")
                print("Press Ctrl+C to stop")
                
                while True:
                    sd.sleep(1000)  # Sleep for 1 second
                    
        except KeyboardInterrupt:
            print("\nStopping wake word detection...")
        except Exception as e:
            print(f"Error in audio processing: {e}")

if __name__ == "__main__":
    processor = AudioProcessor()
    processor.start() 