import { Response } from 'express';
import { authenticatedModulesHandler, authenticatedModuleArticlesHandler } from '../../handlers/authenticatedContent';
import { AuthenticatedRequest } from '../../types';

// Mock the env and database modules
jest.mock('../../env');
jest.mock('../../database');

import { prisma } from '../../database';

describe('Authenticated Content Handlers', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      user: { userId: 1, email: 'test@example.com', role: 'user' },
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('authenticatedModulesHandler', () => {
    it('should return all modules ordered by moduleNumber and created_at', async () => {
      const mockModules = [
        { id: 1, moduleNumber: 1, moduleName: 'Module 1' },
        { id: 2, moduleNumber: 2, moduleName: 'Module 2' },
      ];
      (prisma.module.findMany as jest.Mock).mockResolvedValue(mockModules);

      await authenticatedModulesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.module.findMany).toHaveBeenCalledWith({
        orderBy: [{ moduleNumber: 'asc' }, { created_at: 'asc' }],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockModules);
    });

    it('should handle database errors', async () => {
      (prisma.module.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authenticatedModulesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('authenticatedModuleArticlesHandler', () => {
    it('should return articles for a specific module', async () => {
      mockRequest.params = { moduleId: '1' };
      const mockArticles = [
        { id: 1, moduleId: 1, articleName: 'Article 1', position: 1 },
        { id: 2, moduleId: 1, articleName: 'Article 2', position: 2 },
      ];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      await authenticatedModuleArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: { moduleId: 1 },
        orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockArticles);
    });

    it('should handle database errors', async () => {
      mockRequest.params = { moduleId: '1' };
      (prisma.article.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authenticatedModuleArticlesHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});

