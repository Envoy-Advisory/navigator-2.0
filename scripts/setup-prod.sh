
#!/bin/bash

echo "Setting up production environment..."

# Copy environment files
cp server/.env.prod server/.env
cp client/.env.prod client/.env

# Install dependencies (production only)
cd server && npm ci --only=production && cd ..
cd client && npm ci && cd ..

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

# Build applications
npm run build:prod

echo "Production environment setup complete!"
echo "Run 'npm run start:prod' to start both client and server"
