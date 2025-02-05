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
import requests
import logging
import time

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 1024
BUFFER_DURATION = 10  # seconds to keep in buffer
DETECTION_THRESHOLD = 0.5
CONTINUOUS_TRANSCRIPTION_INTERVAL = 3  # seconds between transcriptions
MAX_MODEL_LOAD_RETRIES = 3
MODEL_LOAD_RETRY_DELAY = 5  # seconds
MODEL_DOWNLOAD_TIMEOUT = 600  # 10 minutes timeout for model download

# Audio processing parameters
NOISE_THRESHOLD = 0.08  # Increased threshold for better noise filtering
MIN_SPEECH_DURATION = 2.0  # Longer minimum duration to avoid fragments
SILENCE_DURATION = 1.0  # Longer silence duration
MAX_REPETITIONS = 1  # More aggressive repetition filtering
ECHO_THRESHOLD = 0.75  # More sensitive echo detection
MIN_SEGMENT_DURATION = 1.0  # Longer minimum segment duration
FEEDBACK_WINDOW = 5  # Window size for feedback detection in seconds

# Feature flags from environment
WAKE_WORD_ENABLED = os.environ.get('ENABLE_WAKE_WORD', 'false').lower() == 'true'
SPEECH_ENABLED = os.environ.get('ENABLE_SPEECH_FEATURES', 'true').lower() == 'true'

# Wake word models to use (only if wake word is enabled)
WAKE_WORDS = ["alexa"]  # Using 'alexa' as temporary replacement for 'gaja'
WAKE_WORD_ALIAS = "gaja"  # What we print when wake word is detected

# Home Assistant Configuration
HASS_HOST = os.environ.get('HASS_HOST', 'http://homeassistant.local:8123')
HASS_TOKEN = os.environ.get('HASS_TOKEN')

def initialize_asr_model():
    """Initialize the ASR model with retries and timeout"""
    model_path = os.environ.get('WHISPER_MODEL_PATH', '/models')
    model_name = os.environ.get('WHISPER_MODEL_TYPE', 'base')
    
    start_time = time.time()
    for attempt in range(MAX_MODEL_LOAD_RETRIES):
        try:
            if time.time() - start_time > MODEL_DOWNLOAD_TIMEOUT:
                logger.error("Model download timeout exceeded")
                raise TimeoutError("Model download took too long")
                
            logger.info(f"Loading ASR model (attempt {attempt + 1}/{MAX_MODEL_LOAD_RETRIES})")
            model = WhisperModel(
                model_size_or_path=model_name,
                device="cpu",
                compute_type="int8",
                download_root=model_path,
                num_workers=1  # Reduce concurrent downloads
            )
            logger.info("ASR model loaded successfully")
            return model
        except Exception as e:
            logger.error(f"Failed to load ASR model (attempt {attempt + 1}): {e}")
            if attempt < MAX_MODEL_LOAD_RETRIES - 1:
                logger.info(f"Retrying in {MODEL_LOAD_RETRY_DELAY} seconds...")
                time.sleep(MODEL_LOAD_RETRY_DELAY)
            else:
                logger.error("Failed to load ASR model after all retries")
                raise

# Initialize the ASR model with retries
try:
    asr_model = initialize_asr_model()
except Exception as e:
    logger.error(f"Critical error initializing ASR model: {e}")
    raise

def send_command_to_hass(domain, service, entity_id):
    """Send command to Home Assistant"""
    if not HASS_TOKEN:
        logger.error("Error: HASS_TOKEN not set")
        return False

    headers = {
        "Authorization": f"Bearer {HASS_TOKEN}",
        "Content-Type": "application/json",
    }

    url = f"{HASS_HOST}/api/services/{domain}/{service}"
    data = {"entity_id": entity_id}

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        logger.info(f"Command sent: {domain}.{service} for {entity_id}")
        return True
    except Exception as e:
        logger.error(f"Error sending command to Home Assistant: {e}")
        return False

def is_speech(audio_data, threshold=NOISE_THRESHOLD):
    """Detect if audio segment contains speech based on amplitude and frequency content"""
    # Calculate RMS amplitude
    rms = np.sqrt(np.mean(np.square(audio_data)))
    
    # Calculate signal energy in speech frequency range (100-4000 Hz)
    fft = np.fft.fft(audio_data)
    freqs = np.fft.fftfreq(len(audio_data), 1/SAMPLE_RATE)
    speech_mask = (np.abs(freqs) >= 100) & (np.abs(freqs) <= 4000)
    speech_energy = np.sum(np.abs(fft[speech_mask])) / len(audio_data)
    
    # Enhanced echo detection
    # 1. Check for periodic patterns in the signal
    autocorr = np.correlate(audio_data, audio_data, mode='full')
    autocorr = autocorr[len(autocorr)//2:]  # Use only positive lags
    peaks = np.where(autocorr > ECHO_THRESHOLD * np.max(autocorr))[0]
    peak_spacing = np.diff(peaks)
    has_periodic_echo = len(peak_spacing) > 2 and np.std(peak_spacing) < 0.1 * np.mean(peak_spacing)
    
    # 2. Check for sudden amplitude changes
    amplitude_envelope = np.abs(audio_data)
    amplitude_changes = np.diff(amplitude_envelope)
    has_feedback_spikes = np.any(np.abs(amplitude_changes) > threshold * 2)
    
    # 3. Check frequency distribution
    freq_magnitudes = np.abs(fft)[:len(fft)//2]
    peak_freqs = freqs[:len(fft)//2][np.argsort(freq_magnitudes)[-3:]]
    has_feedback_freqs = np.any((peak_freqs > 2000) & (peak_freqs < 4000))
    
    # Combine all criteria
    is_valid_speech = (
        rms > threshold and
        speech_energy > threshold and
        not has_periodic_echo and
        not has_feedback_spikes and
        not has_feedback_freqs
    )
    
    return is_valid_speech

def process_command(text):
    """Process the transcribed command and execute appropriate action"""
    text = text.lower().strip()
    
    # Skip if text is too short or contains numbers (likely noise)
    if len(text) < 5 or any(char.isdigit() for char in text):
        logger.debug("Text too short or contains numbers, skipping")
        return
    
    # Enhanced noise pattern detection
    noise_patterns = ["lei", "los", "und", "aber", "nicht mehr", "das das", "und und"]
    for pattern in noise_patterns:
        if text.count(pattern) > 1:  # More aggressive pattern filtering
            logger.debug(f"Detected noise pattern '{pattern}', skipping")
            return
    
    # More aggressive repetition detection
    words = text.split()
    if len(words) >= 2:
        # Check for immediate word repetitions
        for i in range(len(words)-1):
            if words[i] == words[i+1]:
                logger.debug(f"Detected immediate word repetition: '{words[i]}', skipping")
                return
        
        # Check for phrase repetitions
        phrases = [' '.join(words[i:i+2]) for i in range(len(words)-1)]
        phrase_counts = {}
        for phrase in phrases:
            phrase_counts[phrase] = phrase_counts.get(phrase, 0) + 1
            if phrase_counts[phrase] > MAX_REPETITIONS:
                logger.debug(f"Skipping due to excessive repetition: '{phrase}'")
                return
    
    # German command mappings
    commands = {
        "ausschalten": "turn_off",
        "einschalten": "turn_on",
        "an": "turn_on",
        "aus": "turn_off"
    }
    
    rooms = {
        "wohnzimmer": "living_room",
        "küche": "kitchen",
        "schlafzimmer": "bedroom",
        "bad": "bathroom"
    }
    
    # Detect room
    detected_room = None
    for german_room, english_room in rooms.items():
        if german_room in text:
            detected_room = english_room
            break
    
    # Detect command
    detected_command = None
    for german_cmd, english_cmd in commands.items():
        if german_cmd in text:
            detected_command = english_cmd
            break
    
    if detected_room and detected_command:
        # Construct entity ID (assuming light)
        entity_id = f"light.{detected_room}"
        
        # Send command to Home Assistant
        if send_command_to_hass("light", detected_command, entity_id):
            logger.info(f"Executed: {detected_command} for {entity_id}")
        else:
            logger.error("Failed to execute command")
    else:
        logger.debug(f"No command found in text: '{text}'")

class AudioProcessor:
    def __init__(self):
        logger.info("Initializing AudioProcessor...")
        self.audio_buffer = queue.Queue()
        self.recording = False
        self.buffer = np.zeros(SAMPLE_RATE * BUFFER_DURATION)
        self.buffer_lock = threading.Lock()
        self.last_transcription_time = 0
        self.stream = None
        self.speech_detected = False
        self.silence_frames = 0
        self.speech_frames = 0

        # Initialize wake word detection only if enabled
        if WAKE_WORD_ENABLED:
            try:
                logger.info("Initializing wake word model...")
                self.wake_word_model = Model(vad_threshold=0.5)
                self.last_prediction = None
                logger.info("Wake word model initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize wake word model: {e}")
                raise
        else:
            self.wake_word_model = None
            self.last_prediction = None
            logger.info("Wake word detection disabled")

    def should_transcribe(self):
        """Determine if we should transcribe based on mode and timing"""
        current_time = datetime.now().timestamp()
        if not WAKE_WORD_ENABLED:
            # Check if enough time has passed since last transcription
            time_since_last = current_time - self.last_transcription_time
            if time_since_last >= CONTINUOUS_TRANSCRIPTION_INTERVAL:
                # Only transcribe if we detect speech
                frames_per_chunk = CHUNK_SIZE
                min_speech_frames = int(MIN_SPEECH_DURATION * SAMPLE_RATE / frames_per_chunk)
                
                if self.speech_frames >= min_speech_frames:
                    self.last_transcription_time = current_time
                    self.speech_frames = 0  # Reset counter
                    return True
        return False

    def audio_callback(self, indata, frames, time, status):
        """Callback for audio input"""
        if status:
            logger.warning(f"Audio callback status: {status}")
        
        # Convert to mono if necessary
        if CHANNELS > 1:
            audio_data = np.mean(indata, axis=1)
        else:
            audio_data = indata.flatten()

        # Check for speech
        if is_speech(audio_data):
            self.speech_frames += 1
            self.silence_frames = 0
        else:
            self.silence_frames += 1
            frames_per_chunk = CHUNK_SIZE
            silence_frames_threshold = int(SILENCE_DURATION * SAMPLE_RATE / frames_per_chunk)
            
            if self.silence_frames >= silence_frames_threshold:
                self.speech_frames = 0

        # Update circular buffer
        with self.buffer_lock:
            self.buffer = np.roll(self.buffer, -len(audio_data))
            self.buffer[-len(audio_data):] = audio_data

        if WAKE_WORD_ENABLED:
            # Process for wake word detection
            self.last_prediction = self.wake_word_model.predict(audio_data)
            
            # Check if wake word detected
            for wake_word in WAKE_WORDS:
                confidence = self.last_prediction[wake_word]
                if confidence > DETECTION_THRESHOLD:
                    logger.info(
                        f"Wake word: {WAKE_WORD_ALIAS} (confidence: {confidence:.2f})"
                    )
                    self.process_audio()
                    break
        else:
            # Continuous transcription mode
            if self.should_transcribe():
                self.process_audio()

    def process_audio(self):
        """Process the current audio buffer (save and transcribe)"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"/audio/audio_segment_{timestamp}.wav"
        
        # Save the audio buffer to a WAV file
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit audio
            wf.setframerate(SAMPLE_RATE)
            
            # Convert float32 to int16
            audio_data = (self.buffer * 32767).astype(np.int16)
            wf.writeframes(audio_data.tobytes())
        
        logger.info(f"Saved audio segment to {filename}")

        # Transcribe the audio with German language preference
        try:
            segments, info = asr_model.transcribe(
                filename,
                language="de",  # Set German as preferred language
                beam_size=5,
                temperature=0
            )
            
            # Get the full transcribed text
            transcribed_text = " ".join(segment.text for segment in segments)
            logger.info(f"Transcribed text: {transcribed_text}")
            
            # Process the command
            process_command(transcribed_text)
                
        except Exception as e:
            logger.error(f"Error during transcription or processing: {e}")

    def start(self):
        """Start audio processing"""
        try:
            logger.info("Starting audio processor...")
            
            # Log configuration
            logger.debug(f"Sample Rate: {SAMPLE_RATE}")
            logger.debug(f"Channels: {CHANNELS}")
            logger.debug(f"Chunk Size: {CHUNK_SIZE}")
            logger.debug(f"Buffer Duration: {BUFFER_DURATION}")
            logger.debug(f"Wake Word Enabled: {WAKE_WORD_ENABLED}")
            logger.debug(f"Speech Enabled: {SPEECH_ENABLED}")
            logger.debug(f"ASR Model: {os.environ.get('ASR_MODEL')}")
            
            if WAKE_WORD_ENABLED:
                logger.info("Initializing wake word detection...")
                logger.info(f"Loaded wake words: {', '.join(WAKE_WORDS)}")
            else:
                logger.info("Starting continuous transcription mode...")
                interval = CONTINUOUS_TRANSCRIPTION_INTERVAL
                logger.info(f"Will transcribe every {interval} seconds")
            
            try:
                logger.debug("Setting up audio input stream...")
                with sd.InputStream(
                    channels=CHANNELS,
                    samplerate=SAMPLE_RATE,
                    blocksize=CHUNK_SIZE,
                    callback=self.audio_callback
                ):
                    logger.info("Audio input stream started successfully")
                    logger.info("Listening for audio input...")
                    logger.info("Press Ctrl+C to stop")
                    
                    while True:
                        sd.sleep(1000)  # Sleep for 1 second
                        
            except sd.PortAudioError as e:
                logger.error(f"Error setting up audio stream: {e}")
                logger.error("Check if microphone is connected and accessible")
                raise
            except Exception as e:
                logger.error(f"Unexpected error in audio stream: {e}")
                raise
                    
        except KeyboardInterrupt:
            logger.info("\nStopping audio processing...")
        except Exception as e:
            logger.error("Critical error in audio processing", exc_info=True)
            raise

if __name__ == "__main__":
    try:
        logger.info("Initializing AudioProcessor...")
        processor = AudioProcessor()
        processor.start()
    except Exception as e:
        logger.error("Failed to start AudioProcessor", exc_info=True)
        raise 