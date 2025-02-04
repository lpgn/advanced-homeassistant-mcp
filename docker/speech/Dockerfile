FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    portaudio19-dev \
    python3-pyaudio \
    && rm -rf /var/lib/apt/lists/*

# Install fast-whisper and its dependencies
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir faster-whisper

# Install wake word detection
RUN pip install --no-cache-dir openwakeword pyaudio sounddevice

# Create directories
RUN mkdir -p /models /audio

# Download the base model by default
# The model will be downloaded automatically when first used
ENV ASR_MODEL=base.en
ENV ASR_MODEL_PATH=/models

# Create wake word model directory
# Models will be downloaded automatically when first used
RUN mkdir -p /models/wake_word

WORKDIR /app

# Copy the wake word detection script
COPY wake_word_detector.py .

# Set environment variables
ENV WHISPER_MODEL_PATH=/models
ENV WAKEWORD_MODEL_PATH=/models/wake_word
ENV PYTHONUNBUFFERED=1

# Run the wake word detection service
CMD ["python", "wake_word_detector.py"] 