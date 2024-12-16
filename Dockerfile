# Build stage
FROM node:20.10.0-alpine AS builder

WORKDIR /app

# Install TypeScript globally
RUN npm install -g typescript

# Copy source files first
COPY . .

# Install all dependencies (including dev dependencies)
RUN npm install

# Build the project
RUN npm run build

# Production stage
FROM node:20.10.0-alpine

WORKDIR /app

# Set Node options for better compatibility
ENV NODE_OPTIONS="--experimental-modules"
ENV NODE_ENV="production"

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose default port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"] 