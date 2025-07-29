
#!/bin/bash

echo "Setting up local environment..."

# Copy environment files
cp server/.env.local server/.env
cp client/.env.local client/.env

# Install dependencies
npm run install:all

# Generate Prisma client and create database tables
npm run db:generate
npm run db:push

echo "Local environment setup complete!"
echo "Database tables have been created."
echo "Run 'npm run dev:local' to start both client and server"
