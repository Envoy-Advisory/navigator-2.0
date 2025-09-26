import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { initializeDatabase } from './database';
import { getEnvVar, getEnvVarAsNumber } from './env';
import * as handlers from './handlers';
import { authenticateToken, requireAdmin } from './middleware/auth';

// -------------------------
// App & configuration
// -------------------------
const app = express();
const PORT = getEnvVarAsNumber('PORT', 3000);
// File upload endpoint
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mov|avi)$/i;
    const extname = allowedExtensions.test(file.originalname);

    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    console.log('File upload validation:', { filename: file.originalname, mimetype: file.mimetype, extname, mimetypeValid: mimetype });

    if (mimetype && extname) return cb(null, true);
    cb(new Error(`File type not allowed. Received: ${file.mimetype}`));
  }
});


app.use(cors({ origin: getEnvVar('CLIENT_URL', 'http://localhost:5173'), credentials: true }));

// Reasonable body size limits for compressed images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Register endpoints (route exposure) - handlers are implemented in ./handlers
app.post('/api/register', handlers.registerHandler);
app.post('/api/login', handlers.loginHandler);

// Verification, health
app.get('/api/verify', authenticateToken, handlers.verifyHandler);
app.get('/api/health', handlers.healthHandler);

// Public routes for article viewing (no authentication required)
app.get('/api/modules/public', handlers.publicModulesHandler);
app.get('/api/modules/:moduleId/articles/public', handlers.publicModuleArticlesHandler);
app.get('/api/articles/:id/public', handlers.publicArticleHandler);

// Form routes
app.get('/api/modules/:moduleId/forms', authenticateToken, handlers.moduleFormsHandler);
app.get('/api/modules/:moduleId/forms/authenticated', authenticateToken, handlers.moduleFormsAuthHandler);
app.post('/api/forms', authenticateToken, handlers.createFormHandler);
app.put('/api/forms/:id', authenticateToken, handlers.updateFormHandler);
app.delete('/api/forms/:id', authenticateToken, handlers.deleteFormHandler);
app.put('/api/forms/reorder', authenticateToken, handlers.reorderFormsHandler);

// Form response routes (individual user)
app.get('/api/forms/:formId/response', authenticateToken, handlers.getFormResponseHandler);
app.post('/api/forms/:formId/response', authenticateToken, handlers.postFormResponseHandler);
app.get('/api/forms/:formId/organization/users', authenticateToken, handlers.getOrganizationUsersHandler);

// Authenticated user endpoints (require login but not admin)
app.get('/api/modules/authenticated', authenticateToken, handlers.authenticatedModulesHandler);
app.get('/api/modules/:moduleId/articles/authenticated', authenticateToken, handlers.authenticatedModuleArticlesHandler);

// Promote user to admin (for testing - remove in production)
app.post('/api/promote-admin', handlers.promoteAdminHandler);

// Module routes (admin)
app.get('/api/modules', authenticateToken, requireAdmin, handlers.adminGetModulesHandler);
app.post('/api/modules', authenticateToken, requireAdmin, handlers.adminCreateModuleHandler);
app.put('/api/modules/:id', authenticateToken, requireAdmin, handlers.adminUpdateModuleHandler);
app.delete('/api/modules/:id', authenticateToken, requireAdmin, handlers.adminDeleteModuleHandler);

// Article routes
app.get('/api/modules/:moduleId/articles', authenticateToken, requireAdmin, handlers.adminModuleArticlesHandler);
app.post('/api/articles', authenticateToken, requireAdmin, handlers.adminCreateArticleHandler);

// Article reordering endpoint - MUST come before parameterized routes
app.put('/api/articles/reorder', authenticateToken, requireAdmin, handlers.reorderArticlesHandler);
app.put('/api/articles/:id', authenticateToken, requireAdmin, handlers.updateArticleHandler);
app.delete('/api/articles/:id', authenticateToken, requireAdmin, handlers.deleteArticleHandler);
app.post('/api/upload', authenticateToken, requireAdmin, upload.single('file'), handlers.uploadFileHandler);
app.get('/api/files/:id', handlers.serveFileHandler);
app.get('/api/files/:id/info', authenticateToken, handlers.getFileInfoHandler);

// Initialize database on startup
initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
});

// Start server only if not in Vercel environment
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${getEnvVar('NODE_ENV', 'development')}`);
  });
}

export default app;