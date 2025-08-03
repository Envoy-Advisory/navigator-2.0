
#!/bin/bash

echo "Setting up UAT environment..."

# Copy environment files
cp server/.env.uat server/.env
cp client/.env.uat client/.env

# Install dependencies
npm run install:all

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

echo "UAT environment setup complete!"
echo "Run 'npm run build:uat && npm run start:uat' to build and start"
