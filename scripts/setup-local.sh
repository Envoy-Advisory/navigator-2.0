
#!/bin/bash

echo "Setting up local environment..."

# Copy environment files
cp server/.env.local server/.env
cp client/.env.local client/.env

# Install dependencies
npm run install:all

# Generate Prisma client
npm run db:generate

echo "Local environment setup complete!"
echo "Run 'npm run dev:local' to start both client and server"
