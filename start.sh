#!/bin/sh

echo "Starting FastCRM initialization..."

# Initialize database (push schema and seed data)
echo "Initializing database..."
pnpm db:init

echo "Database initialization complete. Starting application..."

# Start the application
exec node build
