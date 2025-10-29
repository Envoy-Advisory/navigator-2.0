import { Response } from 'express';
import {
  getFormResponseHandler,
  postFormResponseHandler,
  getOrganizationUsersHandler,
} from '../../handlers/formResponses';
import { AuthenticatedRequest } from '../../types';

// Mock the env and database modules
jest.mock('../../env');
jest.mock('../../database');

import { prisma, UserService } from '../../database';

describe('Form Responses Handlers', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      user: { userId: 1, email: 'test@example.com', role: 'user' },
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getFormResponseHandler', () => {
    it('should return form response for user organization', async () => {
      mockRequest.params = { formId: '1' };
      const mockUser = { id: 1, organization_id: 100 };
      const mockResponse_data = {
        id: 1,
        formId: 1,
        organizationId: 100,
        answers: { q1: 'answer1' },
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
      };
      (UserService.findById as jest.Mock).mockResolvedValue(mockUser);
      (prisma.formResponse.findUnique as jest.Mock).mockResolvedValue(mockResponse_data);

      await getFormResponseHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(prisma.formResponse.findUnique).toHaveBeenCalledWith({
        where: {
          formId_organizationId: {
            formId: 1,
            organizationId: 100,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockResponse_data);
    });

    it('should return 403 when user has no organization', async () => {
      mockRequest.params = { formId: '1' };
      const mockUser = { id: 1, organization_id: null };
      (UserService.findById as jest.Mock).mockResolvedValue(mockUser);

      await getFormResponseHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User must belong to an organization' });
    });

    it('should return 403 when user is not found', async () => {
      mockRequest.params = { formId: '1' };
      (UserService.findById as jest.Mock).mockResolvedValue(null);

      await getFormResponseHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User must belong to an organization' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { formId: '1' };
      (UserService.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getFormResponseHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('postFormResponseHandler', () => {
    it('should create or update form response successfully', async () => {
      mockRequest.params = { formId: '1' };
      mockRequest.body = { answers: { q1: 'answer1' } };
      const mockUser = { id: 1, organization_id: 100 };
      const mockResponse_data = {
        id: 1,
        formId: 1,
        organizationId: 100,
        userId: 1,
        answers: { q1: 'answer1' },
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
      };
      (UserService.findById as jest.Mock).mockResolvedValue(mockUser);
      (prisma.formResponse.upsert as jest.Mock).mockResolvedValue(mockResponse_data);

      await postFormResponseHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(prisma.formResponse.upsert).toHaveBeenCalledWith({
        where: {
          formId_organizationId: {
            formId: 1,
            organizationId: 100,
          },
        },
        update: {
          answers: { q1: 'answer1' },
          userId: 1,
          updated_at: expect.any(Date),
        },
        create: {
          formId: 1,
          organizationId: 100,
          userId: 1,
          answers: { q1: 'answer1' },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockResponse_data);
    });

    it('should return 403 when user has no organization', async () => {
      mockRequest.params = { formId: '1' };
      mockRequest.body = { answers: {} };
      const mockUser = { id: 1, organization_id: null };
      (UserService.findById as jest.Mock).mockResolvedValue(mockUser);

      await postFormResponseHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User must belong to an organization' });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { formId: '1' };
      mockRequest.body = { answers: {} };
      (UserService.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await postFormResponseHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getOrganizationUsersHandler', () => {
    it('should return users from the same organization', async () => {
      const mockUser = { id: 1, organization_id: 100 };
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' },
      ];
      (UserService.findById as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      await getOrganizationUsersHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(UserService.findById).toHaveBeenCalledWith(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { organization_id: 100 },
        select: { id: true, name: true, email: true },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should return 403 when user has no organization', async () => {
      const mockUser = { id: 1, organization_id: null };
      (UserService.findById as jest.Mock).mockResolvedValue(mockUser);

      await getOrganizationUsersHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User must belong to an organization' });
    });

    it('should handle database errors', async () => {
      (UserService.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getOrganizationUsersHandler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});

