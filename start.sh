#!/bin/bash
export NODE_ENV=production
export NODE_OPTIONS="--disable-warning=ExperimentalWarning"
exec bun --smol --cold-start-caching run dist/index.js
