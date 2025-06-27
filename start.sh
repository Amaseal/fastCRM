#!/bin/sh

echo "Starting FastCRM initialization..."

# Check if database exists, if not create it
if [ ! -f "/app/data/local.db" ]; then
    echo "Database not found. Creating new database..."
    pnpm run db:push
    echo "Database created successfully."
    
    echo "Seeding database with initial data..."
    pnpm run db:seed
    echo "Database seeded successfully."
else
    echo "Database already exists. Running migration compatibility check..."
    pnpm tsx scripts/production-migration-fix.ts
    
    echo "Applying any pending migrations..."
    pnpm run db:migrate
    echo "Migration check complete."
fi

echo "Starting application..."

# Start the application
exec node build
