# Use Bun as the base image
FROM oven/bun:1.0.25

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build TypeScript
RUN bun run build

# Expose port
EXPOSE 4000

# Start the application
CMD ["bun", "run", "start"] 