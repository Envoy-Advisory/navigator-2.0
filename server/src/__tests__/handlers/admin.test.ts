import { Request, Response } from 'express';
import {
  promoteAdminHandler,
  adminGetModulesHandler,
  adminCreateModuleHandler,
  adminUpdateModuleHandler,
  adminDeleteModuleHandler,
  adminModuleArticlesHandler,
  adminCreateArticleHandler,
  reorderArticlesHandler,
  updateArticleHandler,
  deleteArticleHandler,
} from '../../handlers/admin';
import { AuthenticatedRequest } from '../../types';

// Mock the env and database modules
jest.mock('../../env');
jest.mock('../../database');

import { prisma, UserService } from '../../database';

describe('Admin Handlers', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      user: { userId: 1, email: 'admin@example.com', role: 'admin' },
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('promoteAdminHandler', () => {
    it('should promote user to admin successfully', async () => {
      mockRequest.body = { email: 'user@example.com' };
      const mockUser = { id: 2, email: 'user@example.com', role: 'user' };
      (UserService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, role: 'admin' });

      await promoteAdminHandler(mockRequest as Request, mockResponse as Response);

      expect(UserService.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { role: 'admin' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User promoted to admin successfully' });
    });

    it('should return 404 when user is not found', async () => {
      mockRequest.body = { email: 'nonexistent@example.com' };
      (UserService.findByEmail as jest.Mock).mockResolvedValue(null);

      await promoteAdminHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle database errors', async () => {
      mockRequest.body = { email: 'user@example.com' };
      (UserService.findByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

      await promoteAdminHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('adminGetModulesHandler', () => {
    it('should return all modules with articles', async () => {
      const mockModules = [
        { id: 1, moduleNumber: 1, moduleName: 'Module 1', articles: [] },
        { id: 2, moduleNumber: 2, moduleName: 'Module 2', articles: [] },
      ];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(mockModules);

      await adminGetModulesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.module.findMany).toHaveBeenCalledWith({
        include: { articles: true },
        orderBy: { moduleNumber: 'asc' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockModules);
    });

    it('should handle database errors', async () => {
      (prisma.module.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await adminGetModulesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('adminCreateModuleHandler', () => {
    it('should create a new module successfully', async () => {
      mockRequest.body = { moduleNumber: '1', moduleName: 'New Module' };
      const mockModule = { id: 1, moduleNumber: 1, moduleName: 'New Module' };
      (prisma.module.create as jest.Mock).mockResolvedValue(mockModule);

      await adminCreateModuleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.module.create).toHaveBeenCalledWith({
        data: { moduleNumber: 1, moduleName: 'New Module' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockModule);
    });

    it('should return 400 when module number is missing', async () => {
      mockRequest.body = { moduleName: 'New Module' };

      await adminCreateModuleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Module number and name are required' });
    });

    it('should return 400 when module name is missing', async () => {
      mockRequest.body = { moduleNumber: '1' };

      await adminCreateModuleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Module number and name are required' });
    });

    it('should handle database errors', async () => {
      mockRequest.body = { moduleNumber: '1', moduleName: 'New Module' };
      (prisma.module.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await adminCreateModuleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('adminUpdateModuleHandler', () => {
    it('should update a module successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { moduleNumber: '2', moduleName: 'Updated Module' };
      const mockModule = { id: 1, moduleNumber: 2, moduleName: 'Updated Module' };
      (prisma.module.update as jest.Mock).mockResolvedValue(mockModule);

      await adminUpdateModuleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.module.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { moduleNumber: 2, moduleName: 'Updated Module' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockModule);
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { moduleNumber: '1', moduleName: 'Updated Module' };
      (prisma.module.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await adminUpdateModuleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('adminDeleteModuleHandler', () => {
    it('should delete a module successfully', async () => {
      mockRequest.params = { id: '1' };
      (prisma.module.delete as jest.Mock).mockResolvedValue({});

      await adminDeleteModuleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.module.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Module deleted successfully' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      (prisma.module.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await adminDeleteModuleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('adminModuleArticlesHandler', () => {
    it('should return articles for a specific module', async () => {
      mockRequest.params = { moduleId: '1' };
      const mockArticles = [
        { id: 1, moduleId: 1, articleName: 'Article 1', position: 1 },
        { id: 2, moduleId: 1, articleName: 'Article 2', position: 2 },
      ];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await adminModuleArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: { moduleId: 1 },
        orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockArticles);
    });

    it('should handle database errors', async () => {
      mockRequest.params = { moduleId: '1' };
      (prisma.article.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await adminModuleArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('adminCreateArticleHandler', () => {
    it('should create a new article with calculated position', async () => {
      mockRequest.body = {
        moduleId: '1',
        articleName: 'New Article',
        content: 'Article content',
      };
      (prisma.article.findFirst as jest.Mock).mockResolvedValue({ position: 5 });
      const mockArticle = {
        id: 1,
        moduleId: 1,
        articleName: 'New Article',
        content: 'Article content',
        position: 6,
      };
      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      await adminCreateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.article.findFirst).toHaveBeenCalledWith({
        where: { moduleId: 1 },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockArticle);
    });

    it('should create article with position 1 when no articles exist', async () => {
      mockRequest.body = {
        moduleId: '1',
        articleName: 'First Article',
        content: 'Content',
      };
      (prisma.article.findFirst as jest.Mock).mockResolvedValue(null);
      const mockArticle = { id: 1, moduleId: 1, articleName: 'First Article', position: 1 };
      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      await adminCreateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when required fields are missing', async () => {
      mockRequest.body = { moduleId: '1', articleName: 'Article' };

      await adminCreateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Module ID, article name, and content are required',
      });
    });

    it('should handle database errors', async () => {
      mockRequest.body = {
        moduleId: '1',
        articleName: 'New Article',
        content: 'Content',
      };
      (prisma.article.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await adminCreateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('reorderArticlesHandler', () => {
    it('should reorder articles successfully', async () => {
      mockRequest.body = {
        articles: [
          { id: 1, position: 2 },
          { id: 2, position: 1 },
        ],
      };
      const existingArticles = [{ id: 1 }, { id: 2 }];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(existingArticles);
      const updatedArticles = [
        { id: 1, position: 2 },
        { id: 2, position: 1 },
      ];
      (prisma.$transaction as jest.Mock).mockResolvedValue(updatedArticles);

      await reorderArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        select: { id: true },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Articles reordered successfully',
        updatedCount: 2,
        articles: [
          { id: 1, position: 2 },
          { id: 2, position: 1 },
        ],
      });
    });

    it('should return 400 when articles array is missing', async () => {
      mockRequest.body = {};

      await reorderArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Articles array is required' });
    });

    it('should return 400 when articles array is empty', async () => {
      mockRequest.body = { articles: [] };

      await reorderArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Articles array cannot be empty' });
    });

    it('should return 400 when article ID is invalid', async () => {
      mockRequest.body = {
        articles: [{ id: -1, position: 1 }],
      };

      await reorderArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid article ID' });
    });

    it('should return 400 when article position is invalid', async () => {
      mockRequest.body = {
        articles: [{ id: 1, position: 0 }],
      };

      await reorderArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid article position' });
    });

    it('should return 400 when some articles are not found', async () => {
      mockRequest.body = {
        articles: [
          { id: 1, position: 1 },
          { id: 999, position: 2 },
        ],
      };
      (prisma.article.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

      await reorderArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Articles not found: 999' });
    });

    it('should handle database errors', async () => {
      mockRequest.body = {
        articles: [{ id: 1, position: 1 }],
      };
      (prisma.article.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await reorderArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Server error: Database error' });
    });
  });

  describe('updateArticleHandler', () => {
    it('should update an article successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        articleName: 'Updated Article',
        content: 'Updated content',
      };
      const mockArticle = {
        id: 1,
        articleName: 'Updated Article',
        content: 'Updated content',
      };
      (prisma.article.update as jest.Mock).mockResolvedValue(mockArticle);

      await updateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          articleName: 'Updated Article',
          content: 'Updated content',
        },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockArticle);
    });

    it('should return 400 when ID is invalid', async () => {
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { articleName: 'Article', content: 'Content' };

      await updateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid article ID' });
    });

    it('should return 400 when required fields are missing', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { articleName: 'Article' };

      await updateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Article name and content are required',
      });
    });

    it('should return 404 when article is not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { articleName: 'Article', content: 'Content' };
      const error = new Error('Record to update not found');
      (prisma.article.update as jest.Mock).mockRejectedValue(error);

      await updateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Article not found' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { articleName: 'Article', content: 'Content' };
      (prisma.article.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('deleteArticleHandler', () => {
    it('should delete an article successfully', async () => {
      mockRequest.params = { id: '1' };
      (prisma.article.delete as jest.Mock).mockResolvedValue({});

      await deleteArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.article.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Article deleted successfully' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      (prisma.article.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await deleteArticleHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});

