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

# Expose the internal port your app listens on (matches CONFIG.PORT default)
EXPOSE 3000

RUN addgroup -S app && adduser -S app -G app
USER app

# Start command
CMD ["npm","start"]
