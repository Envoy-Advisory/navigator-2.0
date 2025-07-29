
#!/bin/bash

echo "Setting up development environment..."

# Copy environment files
cp server/.env.dev server/.env
cp client/.env.dev client/.env

# Install dependencies
npm run install:all

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

echo "Development environment setup complete!"
echo "Run 'npm run dev:dev' to start both client and server"
