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
RUN pip install --no-cache-dir numpy==1.24.3
RUN pip install --no-cache-dir torch==2.1.2 torchaudio==2.1.2 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir faster-whisper==0.10.0 openwakeword==0.4.0 pyaudio==0.2.14 sounddevice==0.4.6

# Create final image
FROM python:3.10-slim

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    python3-pyaudio \
    && rm -rf /var/lib/apt/lists/*

# Create necessary directories
RUN mkdir -p /models/wake_word /audio

# Set working directory
WORKDIR /app

# Copy the wake word detection script
COPY wake_word_detector.py .

# Set environment variables
ENV WHISPER_MODEL_PATH=/models \
    WAKEWORD_MODEL_PATH=/models/wake_word \
    PYTHONUNBUFFERED=1 \
    ASR_MODEL=base.en \
    ASR_MODEL_PATH=/models

# Add resource limits to Python
ENV PYTHONMALLOC=malloc \
    MALLOC_TRIM_THRESHOLD_=100000 \
    PYTHONDEVMODE=1

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ps aux | grep '[p]ython' || exit 1

# Run the wake word detection service with resource constraints
CMD ["python", "-X", "faulthandler", "wake_word_detector.py"] 