#!/bin/bash

# Wait for PulseAudio to be ready
sleep 2

# Mute the monitor to prevent feedback
pactl set-source-mute alsa_output.pci-0000_00_1b.0.analog-stereo.monitor 1

# Set microphone sensitivity to 65%
pactl set-source-volume alsa_input.pci-0000_00_1b.0.analog-stereo 65%

# Set speaker volume to 40%
pactl set-sink-volume alsa_output.pci-0000_00_1b.0.analog-stereo 40%

# Make the script executable
chmod +x /setup-audio.sh 