#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status
set -x  # Print commands and their arguments as they are executed

echo "Starting audio setup script at $(date)"
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"

# Print environment variables related to audio and speech
echo "ENABLE_WAKE_WORD: ${ENABLE_WAKE_WORD}"
echo "PULSE_SERVER: ${PULSE_SERVER}"
echo "WHISPER_MODEL_PATH: ${WHISPER_MODEL_PATH}"

# Wait for PulseAudio socket to be available
max_wait=30
wait_count=0
while [ ! -e /run/user/1000/pulse/native ]; do
    echo "Waiting for PulseAudio socket... (${wait_count}/${max_wait})"
    sleep 1
    wait_count=$((wait_count + 1))
    if [ $wait_count -ge $max_wait ]; then
        echo "ERROR: PulseAudio socket not available after ${max_wait} seconds"
        exit 1
    fi
done

# Verify PulseAudio connection with detailed error handling
if ! pactl info; then
    echo "ERROR: Failed to connect to PulseAudio server"
    pactl list short modules
    pactl list short clients
    exit 1
fi

# List audio devices with error handling
if ! pactl list sources; then
    echo "ERROR: Failed to list audio devices"
    exit 1
fi

# Ensure wake word detector script is executable
chmod +x /app/wake_word_detector.py

# Start the wake word detector with logging
echo "Starting wake word detector at $(date)"
python /app/wake_word_detector.py 2>&1 | tee /audio/wake_word_detector.log &
wake_word_pid=$!

# Wait and check if the process is still running
sleep 5
if ! kill -0 $wake_word_pid 2>/dev/null; then
    echo "ERROR: Wake word detector process died immediately"
    cat /audio/wake_word_detector.log
    exit 1
fi

# Mute the monitor to prevent feedback
pactl set-source-mute alsa_output.pci-0000_00_1b.0.analog-stereo.monitor 1

# Set microphone sensitivity to 65%
pactl set-source-volume alsa_input.pci-0000_00_1b.0.analog-stereo 65%

# Set speaker volume to 40%
pactl set-sink-volume alsa_output.pci-0000_00_1b.0.analog-stereo 40%

# Keep the script running to prevent container exit
echo "Audio setup complete. Keeping container alive."
tail -f /dev/null 