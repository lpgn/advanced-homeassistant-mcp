#!/bin/bash

# Wait for PulseAudio socket to be available
while [ ! -e /run/user/1000/pulse/native ]; do
    echo "Waiting for PulseAudio socket..."
    sleep 1
done

# Test PulseAudio connection
pactl info || {
    echo "Failed to connect to PulseAudio server"
    exit 1
}

# List audio devices
pactl list sources || {
    echo "Failed to list audio devices"
    exit 1
}

# Start the wake word detector
python /app/wake_word_detector.py

# Mute the monitor to prevent feedback
pactl set-source-mute alsa_output.pci-0000_00_1b.0.analog-stereo.monitor 1

# Set microphone sensitivity to 65%
pactl set-source-volume alsa_input.pci-0000_00_1b.0.analog-stereo 65%

# Set speaker volume to 40%
pactl set-sink-volume alsa_output.pci-0000_00_1b.0.analog-stereo 40%

# Make the script executable
chmod +x /setup-audio.sh 