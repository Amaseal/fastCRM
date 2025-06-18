# Use the official Node.js image
FROM node:20-alpine AS base

# Define build arguments
ARG NODE_ENV=production

# Set environment variables (hardcode DATABASE_URL for build)
ENV DATABASE_URL=/app/data/local.db
ENV NODE_ENV=$NODE_ENV

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Create data directory for build and initialize database
RUN mkdir -p /app/data
RUN pnpm run db:push

# Build the application (DATABASE_URL is available from build arg)
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Define runtime arguments (will be passed from build args)
ARG DATABASE_URL
ARG NODE_ENV=production
ARG NEXTCLOUD_URL

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including dev deps for database operations)
RUN pnpm install --frozen-lockfile

# Copy built application and necessary files
COPY --from=base /app/build ./build
COPY --from=base /app/static ./static
COPY --from=base /app/drizzle ./drizzle
COPY --from=base /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/src ./src

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Create uploads and data directories with proper permissions
RUN mkdir -p uploads && chmod 755 uploads
RUN mkdir -p data && chmod 755 data

# Expose the port
EXPOSE 3000

# Set environment variables from args (runtime)
ENV NODE_ENV=$NODE_ENV
ENV PORT=3000
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTCLOUD_URL=$NEXTCLOUD_URL
ENV NEXTCLOUD_USERNAME=$NEXTCLOUD_USERNAME
ENV NEXTCLOUD_PASSWORD=$NEXTCLOUD_PASSWORD
ENV GAME_PASSWORD=$GAME_PASSWORD
ENV BODY_SIZE_LIMIT=1073741824

# Start the application with database initialization
CMD ["./start.sh"]
