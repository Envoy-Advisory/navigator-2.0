import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin, validateSameOrganization } from '../../middleware/auth';
import { AuthenticatedRequest } from '../../types';

// Mock the env module specifically for this test
jest.mock('../../env');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  const JWT_SECRET = 'test-secret-key';

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and call next', () => {
      const token = jwt.sign({ userId: 1, email: 'test@example.com', role: 'user' }, JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toMatchObject({
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });
      // JWT also adds 'iat' (issued at) field automatically
      expect(mockRequest.user).toHaveProperty('iat');
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', () => {
      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', () => {
      mockRequest.headers = {};
      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when token is expired', () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@example.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token' };
      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Malformed header still extracts "token" part, which then fails verification
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin users', () => {
      mockRequest.user = { userId: 1, email: 'admin@example.com', role: 'admin' };
      requireAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-admin users', () => {
      mockRequest.user = { userId: 1, email: 'user@example.com', role: 'user' };
      requireAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      mockRequest.user = undefined;
      requireAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateSameOrganization', () => {
    const mockUserService = {
      findById: jest.fn(),
    };

    it('should allow access when users are in the same organization', async () => {
      const currentUser = { id: 1, organization_id: 100 };
      const targetUser = { id: 2, organization_id: 100 };
      
      mockRequest.user = { userId: 1, email: 'user@example.com', role: 'user' };
      mockRequest.params = { userId: '2' };
      mockUserService.findById.mockResolvedValueOnce(currentUser).mockResolvedValueOnce(targetUser);

      const middleware = validateSameOrganization(mockUserService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when users are in different organizations', async () => {
      const currentUser = { id: 1, organization_id: 100 };
      const targetUser = { id: 2, organization_id: 200 };
      
      mockRequest.user = { userId: 1, email: 'user@example.com', role: 'user' };
      mockRequest.params = { userId: '2' };
      mockUserService.findById.mockResolvedValueOnce(currentUser).mockResolvedValueOnce(targetUser);

      const middleware = validateSameOrganization(mockUserService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access denied: users must be in the same organization' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when current user has no organization', async () => {
      const currentUser = { id: 1, organization_id: null };
      
      mockRequest.user = { userId: 1, email: 'user@example.com', role: 'user' };
      mockUserService.findById.mockResolvedValueOnce(currentUser);

      const middleware = validateSameOrganization(mockUserService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User must belong to an organization' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.user = { userId: 1, email: 'user@example.com', role: 'user' };
      mockUserService.findById.mockRejectedValueOnce(new Error('Database error'));

      const middleware = validateSameOrganization(mockUserService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle case when no target user ID is provided', async () => {
      const currentUser = { id: 1, organization_id: 100 };
      
      mockRequest.user = { userId: 1, email: 'user@example.com', role: 'user' };
      mockRequest.params = {};
      mockUserService.findById.mockResolvedValueOnce(currentUser);

      const middleware = validateSameOrganization(mockUserService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
