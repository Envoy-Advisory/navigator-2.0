
# Fair Chance Navigator 2.0

A full-stack web application built with React TypeScript frontend and Express.js backend.

## Project Structure

This project consists of two main folders:

### `/client` - Frontend React TypeScript Application

The client folder contains a modern React application built with TypeScript and Vite.

**Technologies:**
- React 18 with TypeScript
- Vite (build tool and dev server)
- React Router DOM for navigation
- CSS modules for styling

**Available Scripts:**
```bash
cd client
npm run dev      # Start development server on port 5173
npm run build    # Build for production
npm run preview  # Preview production build
```

**Development:**
- The dev server runs on `http://localhost:5173`
- Hot module replacement (HMR) enabled for instant updates
- Proxy configured to forward `/api` requests to backend server

**Building:**
- TypeScript compilation with type checking
- Optimized production bundle in `/client/dist`
- Static assets optimization

### `/server` - Backend Express.js API Server

The server folder contains an Express.js API server built with TypeScript.

**Technologies:**
- Express.js with TypeScript
- PostgreSQL database with pg driver
- JWT authentication with bcrypt password hashing
- CORS enabled for cross-origin requests

**Available Scripts:**
```bash
cd server
npm run dev      # Start development server with nodemon on port 5000
npm run build    # Compile TypeScript to JavaScript
npm run start    # Start production server
npm run watch    # Watch mode for TypeScript compilation
```

**Features:**
- User registration and authentication
- JWT token-based authorization
- PostgreSQL database integration
- Automatic database table initialization
- Health check endpoint at `/api/health`

**API Endpoints:**
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/verify` - Token verification (protected)
- `GET /api/health` - Health check

## Getting Started

### Prerequisites
- Node.js and npm installed
- PostgreSQL database (automatically configured in Replit)

### Running the Full Stack Application

1. **Install dependencies for both client and server:**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Start the development servers:**
   - Click the "Run" button in Replit, or
   - Use the "Full Stack Development" workflow to start both servers in parallel

3. **Access the application:**
   - Frontend: Available through the Replit webview
   - Backend API: `http://localhost:5000/api`

### Environment Variables

The server uses the following environment variables:
- `DATABASE_URL` - PostgreSQL connection string (auto-configured in Replit)
- `JWT_SECRET` - Secret key for JWT tokens (defaults to 'your-secret-key')
- `NODE_ENV` - Environment mode (development/production)

## Development Workflow

- The client runs on port 5173 and proxies API calls to the server on port 5000
- Both servers support hot reloading for rapid development
- TypeScript provides type safety across the entire stack
- The database tables are automatically created on server startup

## Deployment

This project is configured for deployment on Replit with static site deployment for the client and the server running as a background service.
