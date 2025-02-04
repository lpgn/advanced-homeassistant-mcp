import os
import json
import queue
import threading
import numpy as np
import sounddevice as sd
from openwakeword import Model
from datetime import datetime
import wave

# Configuration
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 1024
BUFFER_DURATION = 30  # seconds to keep in buffer
DETECTION_THRESHOLD = 0.5

class AudioProcessor:
    def __init__(self):
        self.wake_word_model = Model(
            wakeword_models=["hey_jarvis", "ok_google", "alexa"],
            model_path=os.environ.get('WAKEWORD_MODEL_PATH', '/models/wake_word')
        )
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
        for wake_word, score in prediction.items():
            if score > DETECTION_THRESHOLD:
                print(f"Wake word detected: {wake_word} (confidence: {score:.2f})")
                self.save_audio_segment()
                break

    def save_audio_segment(self):
        """Save the audio buffer when wake word is detected"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"/audio/wake_word_{timestamp}.wav"
        
        # Save the audio buffer to a WAV file
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit audio
            wf.setframerate(SAMPLE_RATE)
            
            # Convert float32 to int16
            audio_data = (self.buffer * 32767).astype(np.int16)
            wf.writeframes(audio_data.tobytes())
        
        print(f"Saved audio segment to {filename}")
        
        # Write metadata
        metadata = {
            "timestamp": timestamp,
            "sample_rate": SAMPLE_RATE,
            "channels": CHANNELS,
            "duration": BUFFER_DURATION
        }
        
        with open(f"{filename}.json", 'w') as f:
            json.dump(metadata, f, indent=2)

    def start(self):
        """Start audio processing"""
        try:
            with sd.InputStream(
                channels=CHANNELS,
                samplerate=SAMPLE_RATE,
                blocksize=CHUNK_SIZE,
                callback=self.audio_callback
            ):
                print("Wake word detection started. Listening...")
                while True:
                    sd.sleep(1000)  # Sleep for 1 second
                    
        except KeyboardInterrupt:
            print("\nStopping wake word detection...")
        except Exception as e:
            print(f"Error in audio processing: {e}")

if __name__ == "__main__":
    print("Initializing wake word detection...")
    processor = AudioProcessor()
    processor.start() 