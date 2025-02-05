# Use Python slim image as builder
FROM python:3.10-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies with specific versions and CPU-only variants
RUN pip install --no-cache-dir \
    "numpy>=1.24.3,<2.0" \
    "sounddevice" \
    "openwakeword" \
    "faster-whisper" \
    "transformers" \
    "torch" \
    "torchaudio" \
    "huggingface_hub" \
    "requests" \
    "soundfile" \
    "tflite-runtime"

# Create final image
FROM python:3.10-slim

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install audio dependencies
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    pulseaudio \
    alsa-utils \
    curl \
    wget

# Create necessary directories with explicit permissions
RUN mkdir -p /models/wake_word /audio /app /models/cache /models/models--Systran--faster-whisper-base /opt/venv/lib/python3.10/site-packages/openwakeword/resources/models \
    && chmod -R 777 /models /audio /app /models/cache /models/models--Systran--faster-whisper-base /opt/venv/lib/python3.10/site-packages/openwakeword/resources/models

# Download wake word models
RUN wget -O /opt/venv/lib/python3.10/site-packages/openwakeword/resources/models/alexa_v0.1.tflite \
    https://github.com/dscripka/openWakeWord/raw/main/openwakeword/resources/models/alexa_v0.1.tflite \
    && wget -O /opt/venv/lib/python3.10/site-packages/openwakeword/resources/models/hey_jarvis_v0.1.tflite \
    https://github.com/dscripka/openWakeWord/raw/main/openwakeword/resources/models/hey_jarvis_v0.1.tflite \
    && chmod 644 /opt/venv/lib/python3.10/site-packages/openwakeword/resources/models/*.tflite

# Set environment variables for model caching
ENV HF_HOME=/models/cache
ENV TRANSFORMERS_CACHE=/models/cache
ENV HUGGINGFACE_HUB_CACHE=/models/cache

# Copy scripts and set permissions explicitly
COPY wake_word_detector.py /app/wake_word_detector.py
COPY setup-audio.sh /setup-audio.sh

# Ensure scripts are executable by any user
RUN chmod 755 /setup-audio.sh /app/wake_word_detector.py

# Create a non-root user with explicit UID and GID
RUN addgroup --gid 1000 user && \
    adduser --uid 1000 --gid 1000 --disabled-password --gecos '' user

# Change ownership of directories
RUN chown -R 1000:1000 /models /audio /app /models/cache /models/models--Systran--faster-whisper-base \
    /opt/venv/lib/python3.10/site-packages/openwakeword/resources/models

# Switch to non-root user
USER user

# Set working directory
WORKDIR /app

# Set environment variables
ENV WHISPER_MODEL_PATH=/models \
    WAKEWORD_MODEL_PATH=/models/wake_word \
    PYTHONUNBUFFERED=1 \
    PULSE_SERVER=unix:/run/user/1000/pulse/native \
    HOME=/home/user

# Start the application
CMD ["/setup-audio.sh"] 