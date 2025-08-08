import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserService, OrganizationService, ModuleService, ArticleService, initializeDatabase, closeDatabase, User } from './database';
import { getEnvVar, getEnvVarAsNumber } from './env';

const app = express();
const PORT = getEnvVarAsNumber('PORT', 5000);

// JWT secret
const JWT_SECRET = getEnvVar('JWT_SECRET', 'your-secret-key');

// Middleware
app.use(cors({
  origin: getEnvVar('CLIENT_URL', 'http://localhost:5173'),
  credentials: true
}));
app.use(express.json());

// Types
interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  headers: any;
}

// Register endpoint
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, organization } = req.body;

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create organization if provided
    let organizationId: number | undefined = undefined;
    if (organization) {
      console.log('Creating organization:', organization);
      const orgResult = await OrganizationService.create(organization);
      organizationId = orgResult.id;
      console.log('Organization created with ID:', organizationId);
    }

    // Create user
    const user = await UserService.create({
      name,
      email,
      password: hashedPassword,
      organizationId
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } as JWTPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id?.toString(),
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await UserService.updateLastLogin(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } as JWTPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id?.toString(),
        createdAt: user.created_at,
        lastLogin: new Date()
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    req.user = user as JWTPayload;
    next();
  });
};

// Protected route to verify token
app.get('/api/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await UserService.findById(req.user!.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id?.toString(),
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin middleware
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

// Module routes
app.get('/api/modules', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const modules = await ModuleService.findAll();
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/modules', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { moduleNumber, moduleName } = req.body;
    
    if (!moduleNumber || !moduleName) {
      return res.status(400).json({ error: 'moduleNumber and moduleName are required' });
    }

    const module = await ModuleService.create({ moduleNumber, moduleName });
    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/modules/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { moduleNumber, moduleName } = req.body;
    
    const module = await ModuleService.update(id, { moduleNumber, moduleName });
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/modules/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await ModuleService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Article routes
app.get('/api/modules/:moduleId/articles', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const articles = await ArticleService.findByModuleId(moduleId);
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/articles', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { moduleId, articleName, content } = req.body;
    
    if (!moduleId || !articleName || content === undefined) {
      return res.status(400).json({ error: 'moduleId, articleName, and content are required' });
    }

    const article = await ArticleService.create({ moduleId, articleName, content });
    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/articles/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { articleName, content, moduleId } = req.body;
    
    const article = await ArticleService.update(id, { articleName, content, moduleId });
    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/articles/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await ArticleService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database on startup
initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
  // Don't throw here as it would prevent the app from starting
});

// Start server only if not in Vercel environment
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${getEnvVar('NODE_ENV', 'development')}`);
  });
}

// For Vercel serverless deployment
export default app;
