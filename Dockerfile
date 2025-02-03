# Use Bun as the base image
FROM oven/bun:1.0.26

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Install dependencies
RUN bun install

# Build TypeScript
RUN bun run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"] 