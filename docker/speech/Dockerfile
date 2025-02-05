# Use Python slim image as builder
FROM python:3.10-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies with specific versions and CPU-only variants
RUN pip install --no-cache-dir "numpy>=1.24.3,<2.0.0" && \
    pip install --no-cache-dir torch==2.1.2 torchaudio==2.1.2 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir faster-whisper==0.10.0 openwakeword==0.4.0 pyaudio==0.2.14 sounddevice==0.4.6 requests==2.31.0 && \
    pip freeze > /opt/venv/requirements.txt

# Create final image
FROM python:3.10-slim

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install audio dependencies
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    python3-pyaudio \
    alsa-utils \
    libasound2 \
    libasound2-plugins \
    pulseaudio \
    pulseaudio-utils \
    libpulse0 \
    libportaudio2 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/run/pulse /var/lib/pulse

# Create necessary directories
RUN mkdir -p /models/wake_word /audio && \
    chown -R 1000:1000 /models /audio && \
    mkdir -p /home/user/.config/pulse && \
    chown -R 1000:1000 /home/user

# Set working directory
WORKDIR /app

# Copy the wake word detection script and audio setup script
COPY wake_word_detector.py .
COPY setup-audio.sh /setup-audio.sh
RUN chmod +x /setup-audio.sh

# Set environment variables
ENV WHISPER_MODEL_PATH=/models \
    WAKEWORD_MODEL_PATH=/models/wake_word \
    PYTHONUNBUFFERED=1 \
    PULSE_SERVER=unix:/run/user/1000/pulse/native \
    HOME=/home/user

# Run as the host user
USER 1000:1000

# Start the application
CMD ["/setup-audio.sh"] 