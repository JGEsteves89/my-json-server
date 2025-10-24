# Use a small Node LTS base
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package metadata first to leverage layer caching
COPY package*.json ./

# Install only production dependencies (change if you need dev deps at build)
RUN npm ci --only=production

# Copy the rest
COPY . .

# Create writable data dir
RUN mkdir -p /app/data

# Expose the internal port your app listens on (matches CONFIG.PORT default)
EXPOSE 3000

# Use a non-root user for safety
RUN addgroup -S app && adduser -S app -G app
USER app

# Start command
CMD ["npm","start"]
