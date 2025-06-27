#!/bin/bash

# Production deployment script with proper migration handling

set -e

echo "🚀 Starting production deployment..."

# Step 1: Fix any existing migration issues
echo "🔧 Running production migration fix..."
npm run db:production-fix

# Step 2: Run any pending migrations
echo "📦 Running database migrations..."
npm run db:migrate

# Step 3: Start the application
echo "🌟 Starting application..."
exec npm start
