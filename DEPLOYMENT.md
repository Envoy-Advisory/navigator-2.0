
# Environment Setup and Deployment Guide

This guide covers how to set up and run the Fair Chance Navigator 2.0 application in different environments.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git (for version control)

### Local Development Prerequisites (Ubuntu)

For local development on Ubuntu systems, you'll need to install PostgreSQL locally. Use the provided installation script:

```bash
# Make the script executable
chmod +x scripts/install-postgresql-ubuntu.sh

# Run the PostgreSQL installation script
./scripts/install-postgresql-ubuntu.sh
```

The script will:
- Install PostgreSQL and additional packages
- Start and enable the PostgreSQL service
- Create a database user `navigator_user`
- Create the database `fair_chance_navigator_local`
- Grant necessary privileges

**Important**: During the installation, you'll be prompted to set a password for the `navigator_user`. Remember this password as you'll need it for the database connection string.

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

**Local Development Database Setup:**
After running the PostgreSQL installation script, update your `server/.env.local` file with the correct database URL:

```bash
DATABASE_URL=postgresql://navigator_user:your_password@localhost:5432/fair_chance_navigator_local
```

Replace `your_password` with the password you set for `navigator_user` during installation.

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

### Initial Setup (Local Development)

After installing PostgreSQL and configuring the DATABASE_URL:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Verify connection by starting the server
npm run dev:local
```

### Ongoing Database Operations

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

### Local PostgreSQL Issues

1. **PostgreSQL not running**:
   ```bash
   sudo systemctl start postgresql
   sudo systemctl status postgresql
   ```

2. **Database connection errors**:
   - Verify the database exists: `sudo -u postgres psql -l`
   - Check user permissions: `sudo -u postgres psql -c "\du"`
   - Test connection manually: `psql -h localhost -U navigator_user -d fair_chance_navigator_local`

3. **Password authentication failed**:
   - Reset user password: `sudo -u postgres psql -c "ALTER USER navigator_user PASSWORD 'new_password';"`
   - Update DATABASE_URL in `.env.local` with the new password

4. **Permission denied errors**:
   ```bash
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fair_chance_navigator_local TO navigator_user;"
   sudo -u postgres psql -d fair_chance_navigator_local -c "GRANT ALL ON SCHEMA public TO navigator_user;"
   ```

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
