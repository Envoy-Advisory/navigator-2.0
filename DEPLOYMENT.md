
# Environment Setup and Deployment Guide

This guide covers how to set up and run the Fair Chance Navigator 2.0 application in different environments.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git (for version control)

## Environment Configuration

The application supports four environments:
- **Local**: Development on your local machine
- **DEV**: Development server environment
- **UAT**: User Acceptance Testing environment
- **PROD**: Production environment

## Quick Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd fair-chance-navigator
npm run install:all
```

### 2. Environment-Specific Setup

Choose your target environment and run the corresponding setup script:

```bash
# Local Development
./scripts/setup-local.sh

# Development Server
./scripts/setup-dev.sh

# UAT Environment
./scripts/setup-uat.sh

# Production Environment
./scripts/setup-prod.sh
```

### 3. Configure Environment Variables

Edit the generated `.env` files in both `server/` and `client/` directories:

**Server Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens (use strong, unique keys for each environment)
- `NODE_ENV`: Environment mode
- `PORT`: Server port (default: 5000)
- `CLIENT_URL`: Frontend URL for CORS configuration

**Client Environment Variables:**
- `VITE_API_URL`: Backend API URL
- `VITE_NODE_ENV`: Environment mode

## Running the Application

### Development Mode (with hot reload)

```bash
# Local environment
npm run dev:local

# Development server
npm run dev:dev

# UAT environment
npm run dev:uat
```

### Production Mode

```bash
# Build for specific environment
npm run build:local   # or build:dev, build:uat, build:prod

# Start production servers
npm run start:local   # or start:dev, start:uat, start:prod
```

## Individual Component Commands

### Server Only

```bash
cd server

# Development
npm run dev:local     # or dev:dev, dev:uat
npm run dev           # uses default environment

# Production
npm run build
npm run start:local   # or start:dev, start:uat, start:prod
```

### Client Only

```bash
cd client

# Development
npm run dev:local     # or dev:dev, dev:uat
npm run dev           # uses default environment

# Production
npm run build:local   # or build:dev, build:uat, build:prod
npm run preview:local # or preview:dev, preview:uat, preview:prod
```

## Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Run migrations (for production)
npm run db:migrate

# Reset database (development only)
npm run db:reset

# Seed database
npm run db:seed
```

## Environment-Specific URLs

- **Local**: 
  - Client: http://localhost:5173
  - Server: http://localhost:5000
- **DEV**: Configure your development server URLs
- **UAT**: Configure your UAT server URLs
- **PROD**: Configure your production URLs

## Security Notes

1. **Never commit `.env` files to version control**
2. **Use strong, unique JWT secrets for each environment**
3. **Use HTTPS in production environments**
4. **Regularly rotate secrets and API keys**
5. **Use environment-specific database instances**

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change the PORT in server/.env
2. **Database connection**: Verify DATABASE_URL is correct
3. **CORS errors**: Ensure CLIENT_URL matches your frontend URL
4. **Missing dependencies**: Run `npm run install:all`

### Environment-Specific Debugging

Check the application logs and ensure:
- Environment variables are loaded correctly
- Database is accessible
- Ports are not blocked by firewall
- SSL certificates are valid (for PROD)

## CI/CD Integration

These scripts can be integrated into your CI/CD pipeline:

```bash
# In your CI/CD script
./scripts/setup-prod.sh
npm run build:prod
npm run start:prod
```
