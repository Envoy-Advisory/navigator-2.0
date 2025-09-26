import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import sharp from 'sharp';
import { prisma as db, UserService, OrganizationService } from './database';
import { getEnvVar } from './env';
import { AuthenticatedRequest } from './types';

const prismaClient: any = db as any;
const JWT_SECRET = getEnvVar('JWT_SECRET', 'your-secret-key');

// File helpers
const saveFileToDatabase = async (fileData: {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  data: Buffer;
  uploadedBy?: number;
}) => {
  try {
  const file = await prismaClient.file.create({
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

export async function uploadFileHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let processedBuffer = req.file.buffer;
    let finalMimetype = req.file.mimetype;

    if (req.file.mimetype.startsWith('image/')) {
      processedBuffer = await sharp(req.file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      finalMimetype = 'image/jpeg';
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(req.file.originalname);
    const filename = `file-${timestamp}-${randomSuffix}${extension}`;

  const fileRecord = await saveFileToDatabase({
      filename,
      originalName: req.file.originalname,
      mimeType: finalMimetype,
      size: processedBuffer.length,
      data: processedBuffer,
      uploadedBy: req.user?.userId
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

export async function serveFileHandler(req: Request, res: Response) {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) return res.status(400).json({ error: 'Invalid file ID' });
  const fileRecord = await prismaClient.file.findUnique({ where: { id: fileId } });
    if (!fileRecord) return res.status(404).json({ error: 'File not found' });

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

export async function getFileInfoHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) return res.status(400).json({ error: 'Invalid file ID' });

  const fileRecord = await prismaClient.file.findUnique({
      where: { id: fileId },
      select: { id: true, filename: true, originalName: true, mimeType: true, size: true, created_at: true }
    });

    if (!fileRecord) return res.status(404).json({ error: 'File not found' });
    res.json(fileRecord);
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Auth handlers
export async function registerHandler(req: Request, res: Response) {
  try {
    const { name, email, password, organization } = req.body;
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let organizationId: number | undefined = undefined;
    if (organization) {
      let existingOrg = await OrganizationService.findByName(organization);
      if (existingOrg) {
        organizationId = existingOrg.id;
      } else {
        const orgResult = await OrganizationService.create(organization);
        organizationId = orgResult.id;
      }
    }

    const user = await UserService.create({ name, email, password: hashedPassword, organizationId });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role } as any, JWT_SECRET, { expiresIn: '24h' });

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

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await UserService.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    await UserService.updateLastLogin(user.id);

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role } as any, JWT_SECRET, { expiresIn: '24h' });

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

export async function verifyHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await UserService.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id.toString(), name: user.name, email: user.email, role: user.role, organizationId: user.organization_id?.toString(), createdAt: user.created_at, lastLogin: user.last_login } });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function healthHandler(_req: Request, res: Response) {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
}

// Public content handlers
export async function publicModulesHandler(_req: Request, res: Response) {
  try {
  const modules = await prismaClient.module.findMany({ orderBy: { moduleNumber: 'asc' } });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching public modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function publicModuleArticlesHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;
  const articles = await prismaClient.article.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function publicArticleHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
  const article = await prismaClient.article.findUnique({ where: { id: parseInt(id) }, include: { module: true } });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    console.error('Error fetching public article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Form handlers
export async function moduleFormsHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;
  const forms = await prismaClient.form.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function moduleFormsAuthHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;
  const forms = await prismaClient.form.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching authenticated forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFormHandler(req: Request, res: Response) {
  try {
    const { moduleId, formName, questions } = req.body;
  const form = await prismaClient.form.create({ data: { moduleId: parseInt(moduleId), formName, questions, position: 0 } });
    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFormHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { formName, questions } = req.body;
  const form = await prismaClient.form.update({ where: { id: parseInt(id) }, data: { formName, questions, updated_at: new Date() } });
    res.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFormHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
  await prismaClient.form.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reorderFormsHandler(req: Request, res: Response) {
  try {
    const { forms } = req.body;
    if (!forms || !Array.isArray(forms)) return res.status(400).json({ error: 'Invalid forms data' });
  await Promise.all(forms.map((form: any) => prismaClient.form.update({ where: { id: form.id }, data: { position: form.position } })));
    res.json({ message: 'Forms reordered successfully' });
  } catch (error) {
    console.error('Error reordering forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Form response handlers
export async function getFormResponseHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { formId } = req.params;
    const currentUser = await UserService.findById(req.user!.userId);
    if (!currentUser || !currentUser.organization_id) return res.status(403).json({ error: 'User must belong to an organization' });

  const response = await prismaClient.formResponse.findUnique({ where: { formId_organizationId: { formId: parseInt(formId), organizationId: currentUser.organization_id } }, include: { user: { select: { id: true, name: true, email: true } } } });
    res.json(response);
  } catch (error) {
    console.error('Error fetching form response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postFormResponseHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { formId } = req.params;
    const { answers } = req.body;
    const currentUser = await UserService.findById(req.user!.userId);
    if (!currentUser || !currentUser.organization_id) return res.status(403).json({ error: 'User must belong to an organization' });

  const response = await prismaClient.formResponse.upsert({ where: { formId_organizationId: { formId: parseInt(formId), organizationId: currentUser.organization_id } }, update: { answers, userId: currentUser.id, updated_at: new Date() }, create: { formId: parseInt(formId), organizationId: currentUser.organization_id, userId: currentUser.id, answers }, include: { user: { select: { id: true, name: true, email: true } } } });

    res.json(response);
  } catch (error) {
    console.error('Error saving form response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrganizationUsersHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const currentUser = await UserService.findById(req.user!.userId);
    if (!currentUser || !currentUser.organization_id) return res.status(403).json({ error: 'User must belong to an organization' });

  const organizationUsers = await prismaClient.user.findMany({ where: { organization_id: currentUser.organization_id }, select: { id: true, name: true, email: true } });
    res.json(organizationUsers);
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Authenticated content handlers
export async function authenticatedModulesHandler(_req: AuthenticatedRequest, res: Response) {
  try {
  const modules = await prismaClient.module.findMany({ orderBy: [ { moduleNumber: 'asc' }, { created_at: 'asc' } ] });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching authenticated modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function authenticatedModuleArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId } = req.params;
  const articles = await prismaClient.article.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching authenticated articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Admin handlers
export async function promoteAdminHandler(req: Request, res: Response) {
  try {
    const { email } = req.body;
  const user = await UserService.findByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
  await prismaClient.user.update({ where: { id: user.id }, data: { role: 'admin' } });
    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminGetModulesHandler(_req: AuthenticatedRequest, res: Response) {
  try {
  const modules = await prismaClient.module.findMany({ include: { articles: true }, orderBy: { moduleNumber: 'asc' } });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreateModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleNumber, moduleName } = req.body;
    if (!moduleNumber || !moduleName) return res.status(400).json({ error: 'Module number and name are required' });
  const module = await prismaClient.module.create({ data: { moduleNumber: parseInt(moduleNumber), moduleName } });
    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminUpdateModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { moduleNumber, moduleName } = req.body;
  const module = await prismaClient.module.update({ where: { id: parseInt(id) }, data: { moduleNumber: parseInt(moduleNumber), moduleName } });
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminDeleteModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
  await prismaClient.module.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminModuleArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId } = req.params;
  const articles = await prismaClient.article.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreateArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId, articleName, content } = req.body;
    if (!moduleId || !articleName || !content) return res.status(400).json({ error: 'Module ID, article name, and content are required' });
  const lastArticle = await prismaClient.article.findFirst({ where: { moduleId: parseInt(moduleId) }, orderBy: { position: 'desc' } as any, select: { position: true } as any });
    const nextPosition = ((lastArticle as any)?.position || 0) + 1;
  const article = await db.article.create({ data: { moduleId: parseInt(moduleId), articleName, content, position: nextPosition } as any });
    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reorderArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { articles } = req.body;
    if (!articles || !Array.isArray(articles)) return res.status(400).json({ error: 'Articles array is required' });
    if (articles.length === 0) return res.status(400).json({ error: 'Articles array cannot be empty' });

    for (const article of articles) {
      if (!article.id || typeof article.id !== 'number' || article.id <= 0) return res.status(400).json({ error: 'Invalid article ID' });
      if (typeof article.position !== 'number' || article.position < 1) return res.status(400).json({ error: 'Invalid article position' });
    }

    const articleIds = articles.map((a: any) => a.id);
  const existingArticles = await db.article.findMany({ where: { id: { in: articleIds } }, select: { id: true } });
    if (existingArticles.length !== articles.length) {
      const existingIds = existingArticles.map(a => a.id);
      const missingIds = articleIds.filter((id: number) => !existingIds.includes(id));
      return res.status(400).json({ error: `Articles not found: ${missingIds.join(', ')}` });
    }

  const updatePromises = articles.map((article: { id: number; position: number }) => prismaClient.article.update({ where: { id: article.id }, data: { position: article.position } as any }));
  const results = await prismaClient.$transaction(updatePromises);
  res.json({ message: 'Articles reordered successfully', updatedCount: results.length, articles: results.map((article: any) => ({ id: article.id, position: (article as any).position })) });
  } catch (error) {
    console.error('Error reordering articles:', error);
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) return res.status(404).json({ error: 'One or more articles not found' });
      if (error.message.includes('Unique constraint')) return res.status(400).json({ error: 'Position conflict detected' });
      return res.status(500).json({ error: `Server error: ${error.message}` });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { articleName, content } = req.body;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'Invalid article ID' });
    if (!articleName || !content) return res.status(400).json({ error: 'Article name and content are required' });
  const article = await prismaClient.article.update({ where: { id: parseInt(id) }, data: { articleName, content } });
    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) return res.status(404).json({ error: 'Article not found' });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
  await prismaClient.article.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
