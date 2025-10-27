# Use a small Node LTS base
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package metadata first to leverage layer caching
COPY package*.json ./

# Install only production dependencies (change if you need dev deps at build)
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the internal port your app listens on (matches CONFIG.PORT default)
EXPOSE 3000

# Copy entrypoint and make it executable as root
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create default app user and switch to it
RUN addgroup -S app && adduser -S app -G app
USER app

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
