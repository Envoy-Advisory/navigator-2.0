import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import { UserService, OrganizationService, initializeDatabase, closeDatabase, User, prisma } from './database';
import { getEnvVar, getEnvVarAsNumber } from './env';

// -------------------------
// App & configuration
// -------------------------
const app = express();
const PORT = getEnvVarAsNumber('PORT', 3000);

// JWT secret
const JWT_SECRET = getEnvVar('JWT_SECRET', 'your-secret-key');

// Middleware
app.use(cors({
  origin: getEnvVar('CLIENT_URL', 'http://localhost:5173'),
  credentials: true
}));

// Reasonable body size limits for compressed images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// Register endpoint (route exposure)
app.post('/api/register', registerHandler);

// Login endpoint (route exposure)
app.post('/api/login', loginHandler);

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

// Organization validation middleware
const validateSameOrganization = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUser = await UserService.findById(req.user!.userId);
    
    if (!currentUser || !currentUser.organization_id) {
      res.status(403).json({ error: 'User must belong to an organization' });
      return;
    }

    if (targetUserId) {
      const targetUser = await UserService.findById(parseInt(targetUserId));
      if (!targetUser || targetUser.organization_id !== currentUser.organization_id) {
        res.status(403).json({ error: 'Access denied: users must be in the same organization' });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Organization validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Protected route to verify token (route exposure)
app.get('/api/verify', authenticateToken, verifyHandler);

// Health check endpoint (route exposure)
app.get('/api/health', healthHandler);

// Public routes for article viewing (no authentication required)
app.get('/api/modules/public', publicModulesHandler);

app.get('/api/modules/:moduleId/articles/public', publicModuleArticlesHandler);

app.get('/api/articles/:id/public', publicArticleHandler);

// Form routes
app.get('/api/modules/:moduleId/forms', authenticateToken, moduleFormsHandler);

app.get('/api/modules/:moduleId/forms/authenticated', authenticateToken, moduleFormsAuthHandler);

app.post('/api/forms', authenticateToken, createFormHandler);

app.put('/api/forms/:id', authenticateToken, updateFormHandler);

app.delete('/api/forms/:id', authenticateToken, deleteFormHandler);

app.put('/api/forms/reorder', authenticateToken, reorderFormsHandler);

// Form response routes (individual user)
app.get('/api/forms/:formId/response', authenticateToken, getFormResponseHandler);

app.post('/api/forms/:formId/response', authenticateToken, postFormResponseHandler);

// Get organization users for a form (to show who can collaborate)
app.get('/api/forms/:formId/organization/users', authenticateToken, getOrganizationUsersHandler);

// Authenticated user endpoints (require login but not admin)
app.get('/api/modules/authenticated', authenticateToken, authenticatedModulesHandler);

app.get('/api/modules/:moduleId/articles/authenticated', authenticateToken, authenticatedModuleArticlesHandler);

// Promote user to admin (for testing - remove in production)
app.post('/api/promote-admin', promoteAdminHandler);

// Admin-only middleware
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

// Module routes
app.get('/api/modules', authenticateToken, requireAdmin, adminGetModulesHandler);

app.post('/api/modules', authenticateToken, requireAdmin, adminCreateModuleHandler);

app.put('/api/modules/:id', authenticateToken, requireAdmin, adminUpdateModuleHandler);

app.delete('/api/modules/:id', authenticateToken, requireAdmin, adminDeleteModuleHandler);

// Article routes
app.get('/api/modules/:moduleId/articles', authenticateToken, requireAdmin, adminModuleArticlesHandler);

app.post('/api/articles', authenticateToken, requireAdmin, adminCreateArticleHandler);

// Article reordering endpoint - MUST come before parameterized routes
app.put('/api/articles/reorder', authenticateToken, requireAdmin, reorderArticlesHandler);

app.put('/api/articles/:id', authenticateToken, requireAdmin, updateArticleHandler);

app.delete('/api/articles/:id', authenticateToken, requireAdmin, deleteArticleHandler);

// File upload endpoint

// Use memory storage for serverless environments
const storage = multer.memoryStorage();

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

// File service functions
const saveFileToDatabase = async (fileData: {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  data: Buffer;
  uploadedBy?: number;
}) => {
  try {
    const file = await prisma.file.create({
      data: {
        filename: fileData.filename,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
        data: fileData.data,
        uploadedBy: fileData.uploadedBy
      }
    });
    return file;
  } catch (error) {
    console.error('Error saving file to database:', error);
    throw error;
  }
};

// File upload endpoint (uses named handler)
app.post('/api/upload', authenticateToken, requireAdmin, upload.single('file'), uploadFileHandler);

// Serve uploaded files from database (named handler)
app.get('/api/files/:id', serveFileHandler);

// Get file metadata (named handler)
app.get('/api/files/:id/info', authenticateToken, getFileInfoHandler);

// -------------------------
// File handlers
// -------------------------
async function uploadFileHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let processedBuffer = req.file.buffer;
    let finalMimetype = req.file.mimetype;

    // Compress images using sharp
    if (req.file.mimetype.startsWith('image/')) {
      console.log('Compressing image:', {
        originalName: req.file.originalname,
        originalSize: req.file.size,
        mimetype: req.file.mimetype
      });

      processedBuffer = await sharp(req.file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      finalMimetype = 'image/jpeg';

      console.log('Image compressed:', {
        originalSize: req.file.size,
        compressedSize: processedBuffer.length,
        compressionRatio: ((req.file.size - processedBuffer.length) / req.file.size * 100).toFixed(1) + '%'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(req.file.originalname);
    const filename = `file-${timestamp}-${randomSuffix}${extension}`;

    // Save file to database
    const fileRecord = await saveFileToDatabase({
      filename,
      originalName: req.file.originalname,
      mimeType: finalMimetype,
      size: processedBuffer.length,
      data: processedBuffer,
      uploadedBy: req.user?.userId
    });

    console.log('File uploaded and saved to database:', {
      id: fileRecord.id,
      filename: fileRecord.filename,
      originalName: fileRecord.originalName,
      size: fileRecord.size
    });

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        url: `/api/files/${fileRecord.id}`,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to save file', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function serveFileHandler(req: Request, res: Response) {
  try {
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const fileRecord = await prisma.file.findUnique({ where: { id: fileId } });
    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', fileRecord.mimeType);
    res.setHeader('Content-Length', fileRecord.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Content-Disposition', `inline; filename="${fileRecord.originalName}"`);

    res.end(fileRecord.data);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getFileInfoHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        created_at: true
      }
    });

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(fileRecord);
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

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

// =========================
// Route Handlers (implementations)
// All handler functions below contain the original implementations.
// Routes above reference these named functions so the top of the file
// contains only route registrations (exposure) while implementations
// live here. No logic changes were made — code moved into functions.
// =========================

// Auth handlers
async function registerHandler(req: Request, res: Response) {
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

    // Find existing organization or create new one if provided
    let organizationId: number | undefined = undefined;
    if (organization) {
      console.log('Looking for organization:', organization);
      let existingOrg = await OrganizationService.findByName(organization);

      if (existingOrg) {
        console.log('Found existing organization with ID:', existingOrg.id);
        organizationId = existingOrg.id;
      } else {
        console.log('Creating new organization:', organization);
        const orgResult = await OrganizationService.create(organization);
        organizationId = orgResult.id;
        console.log('Organization created with ID:', organizationId);
      }
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
}

async function loginHandler(req: Request, res: Response) {
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
}

async function verifyHandler(req: AuthenticatedRequest, res: Response) {
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
}

function healthHandler(req: Request, res: Response) {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
}

// Public content handlers
async function publicModulesHandler(req: Request, res: Response) {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { moduleNumber: 'asc' }
    });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching public modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function publicModuleArticlesHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;

    const articles = await prisma.article.findMany({
      where: { moduleId: parseInt(moduleId) },
      orderBy: [
        { position: 'asc' } as any,
        { created_at: 'asc' }
      ]
    });

    res.json(articles);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function publicArticleHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id: parseInt(id) },
      include: { module: true }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching public article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Form handlers
async function moduleFormsHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;

    const forms = await prisma.form.findMany({
      where: { moduleId: parseInt(moduleId) },
      orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ]
    });

    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function moduleFormsAuthHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;

    const forms = await prisma.form.findMany({
      where: { moduleId: parseInt(moduleId) },
      orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ]
    });

    res.json(forms);
  } catch (error) {
    console.error('Error fetching authenticated forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createFormHandler(req: Request, res: Response) {
  try {
    const { moduleId, formName, questions } = req.body;

    const form = await prisma.form.create({
      data: { moduleId: parseInt(moduleId), formName, questions, position: 0 }
    });

    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateFormHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { formName, questions } = req.body;

    const form = await prisma.form.update({
      where: { id: parseInt(id) },
      data: { formName, questions, updated_at: new Date() }
    });

    res.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteFormHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.form.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function reorderFormsHandler(req: Request, res: Response) {
  try {
    const { forms } = req.body;

    if (!forms || !Array.isArray(forms)) {
      return res.status(400).json({ error: 'Invalid forms data' });
    }

    await Promise.all(forms.map((form: any) =>
      prisma.form.update({ where: { id: form.id }, data: { position: form.position } })
    ));

    res.json({ message: 'Forms reordered successfully' });
  } catch (error) {
    console.error('Error reordering forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Form response handlers
async function getFormResponseHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { formId } = req.params;
    const currentUser = await UserService.findById(req.user!.userId);

    if (!currentUser || !currentUser.organization_id) {
      return res.status(403).json({ error: 'User must belong to an organization' });
    }

    const response = await prisma.formResponse.findUnique({
      where: { formId_organizationId: { formId: parseInt(formId), organizationId: currentUser.organization_id } },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching form response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function postFormResponseHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { formId } = req.params;
    const { answers } = req.body;
    const currentUser = await UserService.findById(req.user!.userId);

    if (!currentUser || !currentUser.organization_id) {
      return res.status(403).json({ error: 'User must belong to an organization' });
    }

    const response = await prisma.formResponse.upsert({
      where: { formId_organizationId: { formId: parseInt(formId), organizationId: currentUser.organization_id } },
      update: { answers, userId: currentUser.id, updated_at: new Date() },
      create: { formId: parseInt(formId), organizationId: currentUser.organization_id, userId: currentUser.id, answers },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.json(response);
  } catch (error) {
    console.error('Error saving form response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getOrganizationUsersHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const currentUser = await UserService.findById(req.user!.userId);

    if (!currentUser || !currentUser.organization_id) {
      return res.status(403).json({ error: 'User must belong to an organization' });
    }

    const organizationUsers = await prisma.user.findMany({
      where: { organization_id: currentUser.organization_id },
      select: { id: true, name: true, email: true }
    });

    res.json(organizationUsers);
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Authenticated user content handlers
async function authenticatedModulesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const modules = await prisma.module.findMany({ orderBy: [ { moduleNumber: 'asc' }, { created_at: 'asc' } ] });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching authenticated modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function authenticatedModuleArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId } = req.params;
    const articles = await prisma.article.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching authenticated articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Admin & module handlers
async function promoteAdminHandler(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const user = await UserService.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminGetModulesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const modules = await prisma.module.findMany({ include: { articles: true }, orderBy: { moduleNumber: 'asc' } });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminCreateModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleNumber, moduleName } = req.body;
    if (!moduleNumber || !moduleName) {
      return res.status(400).json({ error: 'Module number and name are required' });
    }
    const module = await prisma.module.create({ data: { moduleNumber: parseInt(moduleNumber), moduleName } });
    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminUpdateModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { moduleNumber, moduleName } = req.body;
    const module = await prisma.module.update({ where: { id: parseInt(id) }, data: { moduleNumber: parseInt(moduleNumber), moduleName } });
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminDeleteModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.module.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminModuleArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId } = req.params;
    const articles = await prisma.article.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminCreateArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId, articleName, content } = req.body;
    if (!moduleId || !articleName || !content) {
      return res.status(400).json({ error: 'Module ID, article name, and content are required' });
    }
    const lastArticle = await prisma.article.findFirst({ where: { moduleId: parseInt(moduleId) }, orderBy: { position: 'desc' } as any, select: { position: true } as any });
    const nextPosition = ((lastArticle as any)?.position || 0) + 1;
    const article = await prisma.article.create({ data: { moduleId: parseInt(moduleId), articleName, content, position: nextPosition } as any });
    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function reorderArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    console.log('Reorder request body:', JSON.stringify(req.body, null, 2));
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles)) {
      console.error('Articles validation failed - not array:', articles);
      return res.status(400).json({ error: 'Articles array is required' });
    }

    if (articles.length === 0) {
      console.error('Articles validation failed - empty array');
      return res.status(400).json({ error: 'Articles array cannot be empty' });
    }

    console.log('Reordering articles:', articles);

    for (const article of articles) {
      console.log('Validating article:', article);
      if (!article.id || typeof article.id !== 'number' || article.id <= 0) {
        console.error('Invalid article ID:', article);
        return res.status(400).json({ error: 'Invalid article ID' });
      }
      if (typeof article.position !== 'number' || article.position < 1) {
        console.error('Invalid article position:', article);
        return res.status(400).json({ error: 'Invalid article position' });
      }
    }

    const articleIds = articles.map((article: { id: number; position: number }) => article.id);
    const existingArticles = await prisma.article.findMany({ where: { id: { in: articleIds } }, select: { id: true } });

    if (existingArticles.length !== articles.length) {
      const existingIds = existingArticles.map(a => a.id);
      const missingIds = articleIds.filter(id => !existingIds.includes(id));
      return res.status(400).json({ error: `Articles not found: ${missingIds.join(', ')}` });
    }

    const updatePromises = articles.map((article: { id: number; position: number }) => {
      console.log(`Updating article ${article.id} to position ${article.position}`);
      return prisma.article.update({ where: { id: article.id }, data: { position: article.position } as any });
    });

    const results = await prisma.$transaction(updatePromises);
    console.log('Article reordering completed:', results.length, 'articles updated');

    res.json({ message: 'Articles reordered successfully', updatedCount: results.length, articles: results.map(article => ({ id: article.id, position: (article as any).position })) });
  } catch (error) {
    console.error('Error reordering articles:', error);
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        res.status(404).json({ error: 'One or more articles not found' });
      } else if (error.message.includes('Unique constraint')) {
        res.status(400).json({ error: 'Position conflict detected' });
      } else {
        res.status(500).json({ error: `Server error: ${error.message}` });
      }
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function updateArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { articleName, content } = req.body;
    console.log('Article update request:', { id, articleName, content });
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'Invalid article ID' });
    if (!articleName || !content) return res.status(400).json({ error: 'Article name and content are required' });
    const article = await prisma.article.update({ where: { id: parseInt(id) }, data: { articleName, content } });
    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      res.status(404).json({ error: 'Article not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function deleteArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.article.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}