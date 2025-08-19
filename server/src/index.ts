import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import { UserService, OrganizationService, initializeDatabase, closeDatabase, User, prisma } from './database';
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
  file?: Express.Multer.File;
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

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public routes for article viewing (no authentication required)
app.get('/api/modules/public', async (req: Request, res: Response) => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: {
        moduleNumber: 'asc'
      }
    });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching public modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/modules/:moduleId/articles/public', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const articles = await prisma.article.findMany({
      where: { moduleId: parseInt(moduleId) },
      orderBy: [
        { position: 'asc' },
        { created_at: 'asc' }
      ]
    });

    res.json(articles);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/articles/:id/public', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id: parseInt(id) },
      include: {
        module: true
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching public article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Promote user to admin (for testing - remove in production)
app.post('/api/promote-admin', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await UserService.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role to admin
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' }
    });

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin-only middleware
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

// Module routes
app.get('/api/modules', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const modules = await prisma.module.findMany({
      include: {
        articles: true
      },
      orderBy: {
        moduleNumber: 'asc'
      }
    });
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
      return res.status(400).json({ error: 'Module number and name are required' });
    }

    const module = await prisma.module.create({
      data: {
        moduleNumber: parseInt(moduleNumber),
        moduleName
      }
    });

    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/modules/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { moduleNumber, moduleName } = req.body;

    const module = await prisma.module.update({
      where: { id: parseInt(id) },
      data: {
        moduleNumber: parseInt(moduleNumber),
        moduleName
      }
    });

    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/modules/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.module.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Article routes
app.get('/api/modules/:moduleId/articles', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { moduleId } = req.params;

    const articles = await prisma.article.findMany({
      where: { moduleId: parseInt(moduleId) },
      orderBy: [
        { position: 'asc' },
        { created_at: 'asc' }
      ]
    });

    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/articles', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { moduleId, articleName, content } = req.body;

    if (!moduleId || !articleName || !content) {
      return res.status(400).json({ error: 'Module ID, article name, and content are required' });
    }

    const article = await prisma.article.create({
      data: {
        moduleId: parseInt(moduleId),
        articleName,
        content
      }
    });

    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/articles/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { articleName, content } = req.body;

    const article = await prisma.article.update({
      where: { id: parseInt(id) },
      data: {
        articleName,
        content
      }
    });

    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/articles/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.article.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Article reordering endpoint
app.put('/api/articles/reorder', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles)) {
      return res.status(400).json({ error: 'Articles array is required' });
    }

    // Update article positions
    const updatePromises = articles.map((article: { id: number; position: number }) =>
      prisma.article.update({
        where: { id: article.id },
        data: { position: article.position }
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Articles reordered successfully' });
  } catch (error) {
    console.error('Error reordering articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Configure multer storage outside the endpoint
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
} else {
  console.log('Uploads directory exists:', uploadsDir);
  console.log('Files in uploads:', fs.readdirSync(uploadsDir));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file extension
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mov|avi)$/i;
    const extname = allowedExtensions.test(file.originalname);

    // Check MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo'
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    console.log('File upload validation:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extname,
      mimetypeValid: mimetype
    });

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Received: ${file.mimetype}`));
    }
  }
});

// File upload endpoint
app.post('/api/upload', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const uploadMiddleware = upload.single('file');

  uploadMiddleware(req as any, res as any, (err: any) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('File uploaded successfully:', {
      originalName: req.file.originalname,
      savedAs: req.file.filename,
      url: fileUrl,
      path: req.file.path
    });
    
    res.json({ 
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  });
});

// Serve uploaded files with proper CORS and content-type headers
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  console.log('Static file request:', req.url);
  console.log('Full path:', path.join(__dirname, '../../uploads', req.url));
  console.log('File exists:', fs.existsSync(path.join(__dirname, '../../uploads', req.url)));
  
  // Set CORS headers for file serving
  res.header('Access-Control-Allow-Origin', getEnvVar('CLIENT_URL', 'http://localhost:5173'));
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Set proper content type based on file extension
  const ext = path.extname(req.url).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4'
  };

  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }
  
  next();
}, express.static(path.join(__dirname, '../../uploads'), {
  setHeaders: (res, path, stat) => {
    // Additional security headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Alternative route for API-based file serving (fallback)
app.get('/api/files/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);

  console.log('API file request for:', filename);
  console.log('Looking for file at:', filePath);
  console.log('File exists:', fs.existsSync(filePath));

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('Available files:', fs.readdirSync(path.join(__dirname, '../../uploads')));
    return res.status(404).json({ error: 'File not found' });
  }

  // Set proper content type
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4'
  };

  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }

  res.sendFile(filePath);
});

// Add endpoint to list all uploaded files (for debugging)
app.get('/api/files', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const uploadsPath = path.join(__dirname, '../../uploads');
    const files = fs.readdirSync(uploadsPath).map((filename: string) => ({
      filename,
      url: `/uploads/${filename}`,
      apiUrl: `/api/files/${filename}`,
      size: fs.statSync(path.join(uploadsPath, filename)).size,
      created: fs.statSync(path.join(uploadsPath, filename)).birthtime
    }));
    
    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Public endpoint to test image serving
app.get('/api/test-image/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);
  
  console.log('Testing image access for:', filename);
  console.log('File path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      error: 'File not found',
      filename,
      availableFiles: fs.readdirSync(path.join(__dirname, '../../uploads'))
    });
  }
  
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };

  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.sendFile(filePath);
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