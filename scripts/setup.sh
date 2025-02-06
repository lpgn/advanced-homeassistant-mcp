#!/bin/bash

# Copy template if .env doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from template. Please update your credentials!"
fi

# Validate required variables
required_vars=("HASS_HOST" "HASS_TOKEN")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "ERROR: Missing required variables in .env:"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

# Check Docker version compatibility
docker_version=$(docker --version | awk '{print $3}' | cut -d',' -f1)
if [ "$(printf '%s\n' "20.10.0" "$docker_version" | sort -V | head -n1)" != "20.10.0" ]; then
    echo "ERROR: Docker version 20.10.0 or higher required"
    exit 1
fi

echo "Environment validation successful" 