# Use Node.js 20.10.0 as the base image
FROM node:20.10.0-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port your app runs on (if needed)
# EXPOSE 3000

# Start the application
CMD ["npm", "start"] 