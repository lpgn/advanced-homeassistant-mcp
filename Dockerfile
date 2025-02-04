# Use Bun as the base image with specific platform for better optimization
FROM --platform=linux/amd64 oven/bun:1.2.2-slim as builder

# Set working directory
WORKDIR /app

# Install only the minimal dependencies needed and clean up in the same layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /var/cache/apt/*

# Set build-time environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=2048" \
    BUN_INSTALL_CACHE=false \
    BUN_INSTALL_VERBOSE=true

# Copy only package files first
COPY package.json ./
COPY tsconfig*.json ./

# Install ALL dependencies (including devDependencies) for build
RUN bun install --no-cache \
    --no-progress \
    && rm -rf ~/.bun/install/cache

# Copy source files and build
COPY src ./src
RUN bun build ./src/index.ts --target=bun --minify --outdir=./dist

# Create a smaller production image
FROM --platform=linux/amd64 oven/bun:1.2.2-slim as runner

# Set production environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=1024" \
    BUN_INSTALL_CACHE=false

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs

WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder --chown=bunjs:nodejs /app/dist ./dist
COPY --from=builder --chown=bunjs:nodejs /app/node_modules ./node_modules
COPY --chown=bunjs:nodejs package.json ./

# Switch to non-root user
USER bunjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Expose port
EXPOSE 4000

# Start the application with optimized flags
CMD ["bun", "--smol", "run", "start"] 