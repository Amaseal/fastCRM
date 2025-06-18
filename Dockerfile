# Use the official Node.js image
FROM node:20-alpine AS base

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

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

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

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Create uploads directory with proper permissions
RUN mkdir -p static/uploads && chmod 755 static/uploads

# Expose the port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application with database initialization
CMD ["./start.sh"]
