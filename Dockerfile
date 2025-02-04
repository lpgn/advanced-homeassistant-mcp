# Use Node.js as base for building
FROM node:20-slim as builder

# Set working directory
WORKDIR /app

# Install bun
RUN npm install -g bun@1.0.25

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
    BUN_INSTALL_CACHE=0

# Copy only package files first
COPY package.json ./

# Install dependencies with a clean slate
RUN rm -rf node_modules .bun bun.lockb && \
    bun install --no-save

# Copy source files and build
COPY src ./src
COPY tsconfig*.json ./
RUN bun build ./src/index.ts --target=bun --minify --outdir=./dist

# Create a smaller production image
FROM node:20-slim as runner

# Install bun in production image
RUN npm install -g bun@1.0.25

# Set production environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=1024"

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs

WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder --chown=bunjs:nodejs /app/dist ./dist
COPY --from=builder --chown=bunjs:nodejs /app/node_modules ./node_modules
COPY --chown=bunjs:nodejs package.json ./

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R bunjs:nodejs /app/logs

# Switch to non-root user
USER bunjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Expose port
EXPOSE 4000

# Start the application with optimized flags
CMD ["bun", "--smol", "run", "start"] 