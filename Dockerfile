# Use Bun as the base image
FROM oven/bun:1.0.25 as builder

# Set working directory
WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json bun.lockb ./

# Install dependencies with production flag
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Build TypeScript
RUN bun run build

# Create production image
FROM oven/bun:1.0.25-slim

WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Start the application
CMD ["bun", "run", "start"] 