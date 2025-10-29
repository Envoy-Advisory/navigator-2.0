import { Request, Response } from 'express';
import { publicModulesHandler, publicModuleArticlesHandler, publicArticleHandler } from '../../handlers/publicContent';

// Mock the env and database modules
jest.mock('../../env');
jest.mock('../../database');

import { prisma } from '../../database';

describe('Public Content Handlers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: {},
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('publicModulesHandler', () => {
    it('should return all modules ordered by moduleNumber', async () => {
      const mockModules = [
        { id: 1, moduleNumber: 1, moduleName: 'Module 1' },
        { id: 2, moduleNumber: 2, moduleName: 'Module 2' },
      ];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(mockModules);

      await publicModulesHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.module.findMany).toHaveBeenCalledWith({ orderBy: { moduleNumber: 'asc' } });
      expect(mockResponse.json).toHaveBeenCalledWith(mockModules);
    });

    it('should handle database errors', async () => {
      (prisma.module.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await publicModulesHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('publicModuleArticlesHandler', () => {
    it('should return articles for a specific module', async () => {
      mockRequest.params = { moduleId: '1' };
      const mockArticles = [
        { id: 1, moduleId: 1, articleName: 'Article 1', position: 1 },
        { id: 2, moduleId: 1, articleName: 'Article 2', position: 2 },
      ];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await publicModuleArticlesHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: { moduleId: 1 },
        orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockArticles);
    });

    it('should handle database errors', async () => {
      mockRequest.params = { moduleId: '1' };
      (prisma.article.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await publicModuleArticlesHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('publicArticleHandler', () => {
    it('should return a specific article with module information', async () => {
      mockRequest.params = { id: '1' };
      const mockArticle = {
        id: 1,
        moduleId: 1,
        articleName: 'Article 1',
        content: 'Content',
        module: { id: 1, moduleName: 'Module 1' },
      };
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      await publicArticleHandler(mockRequest as Request, mockResponse as Response);

      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { module: true },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockArticle);
    });

    it('should return 404 when article is not found', async () => {
      mockRequest.params = { id: '999' };
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      await publicArticleHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Article not found' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      (prisma.article.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await publicArticleHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});

