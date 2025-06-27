#!/bin/bash

# Production deployment script for handling migrations
# This script should be run before starting the application

echo "🚀 Starting production deployment..."

# Check if this is the first deployment or if we need to handle existing tables
echo "🔍 Checking for existing database state..."

# Run the production migration fix script
echo "🛠️  Running migration compatibility check..."
npx tsx scripts/production-migration-fix.ts

# Now run the actual migrations (this will apply any new migrations)
echo "📦 Applying database migrations..."
npx drizzle-kit migrate

echo "✅ Database setup complete!"

# Start the application
echo "🎬 Starting application..."
exec "$@"
