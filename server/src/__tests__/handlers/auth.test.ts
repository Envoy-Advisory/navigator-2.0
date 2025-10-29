import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerHandler, loginHandler, verifyHandler, healthHandler } from '../../handlers/auth';
import { UserService, OrganizationService } from '../../database';
import { AuthenticatedRequest } from '../../types';

// Mock the env and database modules before importing
jest.mock('../../env');
jest.mock('../../database');

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockOrganizationService = OrganizationService as jest.Mocked<typeof OrganizationService>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Handlers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('registerHandler', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        organization: 'Test Org',
      };
      mockRequest.body = userData;

      const mockHashedPassword = 'hashed-password';
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: mockHashedPassword,
        role: 'user',
        organization_id: 1,
        created_at: new Date(),
        last_login: null,
      };
      const mockOrganization = {
        id: 1,
        name: 'Test Org',
        created_at: new Date(),
        subscription_type: 'free',
        settings: {},
      };
      const mockToken = 'jwt-token';

      mockUserService.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
      mockOrganizationService.findByName.mockResolvedValue(mockOrganization);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue(mockToken as never);

      await registerHandler(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockOrganizationService.findByName).toHaveBeenCalledWith('Test Org');
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: mockHashedPassword,
        organizationId: 1,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          organizationId: '1',
          createdAt: mockUser.created_at,
          lastLogin: mockUser.last_login,
        },
        token: mockToken,
      });
    });

    it('should return error when user already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      mockRequest.body = userData;

      const existingUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        role: 'user',
        organization_id: 1,
        created_at: new Date(),
        last_login: null,
      };

      mockUserService.findByEmail.mockResolvedValue(existingUser);

      await registerHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User already exists' });
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it('should create new organization when it does not exist', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        organization: 'New Org',
      };
      mockRequest.body = userData;

      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        role: 'user',
        organization_id: 2,
        created_at: new Date(),
        last_login: null,
      };
      const newOrganization = { id: 2, name: 'New Org' };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      mockOrganizationService.findByName.mockResolvedValue(null);
      mockOrganizationService.create.mockResolvedValue(newOrganization);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue('jwt-token' as never);

      await registerHandler(mockRequest as Request, mockResponse as Response);

      expect(mockOrganizationService.create).toHaveBeenCalledWith('New Org');
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        organizationId: 2,
      });
    });

    it('should handle registration without organization', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      mockRequest.body = userData;

      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        role: 'user',
        organization_id: null,
        created_at: new Date(),
        last_login: null,
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue('jwt-token' as never);

      await registerHandler(mockRequest as Request, mockResponse as Response);

      expect(mockOrganizationService.findByName).not.toHaveBeenCalled();
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        organizationId: undefined,
      });
    });

    it('should handle registration errors', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      mockRequest.body = userData;

      mockUserService.findByEmail.mockRejectedValue(new Error('Database error'));

      await registerHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('loginHandler', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };
      mockRequest.body = loginData;

      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        role: 'user',
        organization_id: 1,
        created_at: new Date(),
        last_login: new Date(),
      };
      const mockToken = 'jwt-token';

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);
      mockJwt.sign.mockReturnValue(mockToken as never);

      await loginHandler(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          organizationId: '1',
          createdAt: mockUser.created_at,
          lastLogin: expect.any(Date),
        },
        token: mockToken,
      });
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      mockRequest.body = loginData;

      mockUserService.findByEmail.mockResolvedValue(null);

      await loginHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };
      mockRequest.body = loginData;

      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        role: 'user',
        organization_id: 1,
        created_at: new Date(),
        last_login: new Date(),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await loginHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
      expect(mockUserService.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };
      mockRequest.body = loginData;

      mockUserService.findByEmail.mockRejectedValue(new Error('Database error'));

      await loginHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('verifyHandler', () => {
    it('should verify token and return user data', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        role: 'user',
        organization_id: 1,
        created_at: new Date(),
        last_login: new Date(),
      };

      const mockRequest = {
        user: { userId: 1, email: 'john@example.com', role: 'user' },
      } as AuthenticatedRequest;

      mockUserService.findById.mockResolvedValue(mockUser);

      await verifyHandler(mockRequest, mockResponse as Response);

      expect(mockUserService.findById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          organizationId: '1',
          createdAt: mockUser.created_at,
          lastLogin: mockUser.last_login,
        },
      });
    });

    it('should return error when user not found', async () => {
      const mockRequest = {
        user: { userId: 999, email: 'nonexistent@example.com', role: 'user' },
      } as AuthenticatedRequest;

      mockUserService.findById.mockResolvedValue(null);

      await verifyHandler(mockRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle verification errors', async () => {
      const mockRequest = {
        user: { userId: 1, email: 'john@example.com', role: 'user' },
      } as AuthenticatedRequest;

      mockUserService.findById.mockRejectedValue(new Error('Database error'));

      await verifyHandler(mockRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('healthHandler', () => {
    it('should return health status', () => {
      healthHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'OK',
        timestamp: expect.any(String),
      });
    });
  });
});
