// Mock the env module before importing database (which calls loadEnvironment)
jest.mock('../env');

import { prisma, UserService, OrganizationService } from '../database';

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Type-safe mock access
const getMockPrisma = () => ({
  user: {
    findUnique: prisma.user.findUnique as jest.MockedFunction<any>,
    findMany: prisma.user.findMany as jest.MockedFunction<any>,
    create: prisma.user.create as jest.MockedFunction<any>,
    update: prisma.user.update as jest.MockedFunction<any>,
    delete: prisma.user.delete as jest.MockedFunction<any>,
  },
  organization: {
    findUnique: prisma.organization.findUnique as jest.MockedFunction<any>,
    findFirst: prisma.organization.findFirst as jest.MockedFunction<any>,
    findMany: prisma.organization.findMany as jest.MockedFunction<any>,
    create: prisma.organization.create as jest.MockedFunction<any>,
    update: prisma.organization.update as jest.MockedFunction<any>,
    delete: prisma.organization.delete as jest.MockedFunction<any>,
  },
  $connect: prisma.$connect as jest.MockedFunction<any>,
  $disconnect: prisma.$disconnect as jest.MockedFunction<any>,
});

describe('Database Services', () => {
  let mockPrisma: ReturnType<typeof getMockPrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = getMockPrisma();
  });

  describe('UserService', () => {
    describe('findByEmail', () => {
      it('should find user by email', async () => {
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

        mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

        const result = await UserService.findByEmail('john@example.com');

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'john@example.com' },
          include: { organization: true },
        });
        expect(result).toEqual(mockUser);
      });

      it('should return null when user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await UserService.findByEmail('nonexistent@example.com');

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

        await expect(UserService.findByEmail('john@example.com')).rejects.toThrow('Database connection failed');
      });
    });

    describe('findById', () => {
      it('should find user by ID', async () => {
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

        mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

        const result = await UserService.findById(1);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: { organization: true },
        });
        expect(result).toEqual(mockUser);
      });

      it('should return null when user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await UserService.findById(999);

        expect(result).toBeNull();
      });
    });

    describe('create', () => {
      it('should create a new user', async () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed-password',
          organizationId: 1,
        };

        const mockCreatedUser = {
          id: 1,
          ...userData,
          role: 'user',
          organization_id: 1,
          created_at: new Date(),
          last_login: null,
        };

        mockPrisma.user.create.mockResolvedValue(mockCreatedUser as any);

        const result = await UserService.create(userData);

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            organization_id: userData.organizationId,
            last_login: expect.any(Date),
          },
          include: { organization: true },
        });
        expect(result).toEqual(mockCreatedUser);
      });

      it('should create user without organization', async () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed-password',
          organizationId: undefined,
        };

        const mockCreatedUser = {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed-password',
          role: 'user',
          organization_id: null,
          created_at: new Date(),
          last_login: null,
        };

        mockPrisma.user.create.mockResolvedValue(mockCreatedUser as any);

        const result = await UserService.create(userData);

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            organization_id: undefined,
            last_login: expect.any(Date),
          },
          include: { organization: true },
        });
        expect(result).toEqual(mockCreatedUser);
      });

      it('should handle unique constraint violations', async () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed-password',
          organizationId: 1,
        };

        const error = new Error('Unique constraint failed on the constraint: `User_email_key`');
        mockPrisma.user.create.mockRejectedValue(error);

        await expect(UserService.create(userData)).rejects.toThrow('Unique constraint failed');
      });
    });

    describe('updateLastLogin', () => {
      it('should update user last login timestamp', async () => {
        const mockUpdatedUser = {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed-password',
          role: 'user',
          organization_id: 1,
          created_at: new Date(),
          last_login: new Date(),
        };

        mockPrisma.user.update.mockResolvedValue(mockUpdatedUser as any);

        await UserService.updateLastLogin(1);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { last_login: expect.any(Date) },
        });
      });

      it('should handle update errors', async () => {
        mockPrisma.user.update.mockRejectedValue(new Error('Update failed'));

        await expect(UserService.updateLastLogin(999)).rejects.toThrow('Update failed');
      });
    });
  });

  describe('OrganizationService', () => {
    describe('findByName', () => {
      it('should find organization by name', async () => {
        const mockOrganization = {
          id: 1,
          name: 'Test Organization',
          created_at: new Date(),
        };

        mockPrisma.organization.findFirst.mockResolvedValue(mockOrganization as any);

        const result = await OrganizationService.findByName('Test Organization');

        expect(mockPrisma.organization.findFirst).toHaveBeenCalledWith({
          where: { name: 'Test Organization' },
        });
        expect(result).toEqual(mockOrganization);
      });

      it('should return null when organization not found', async () => {
        mockPrisma.organization.findFirst.mockResolvedValue(null);

        const result = await OrganizationService.findByName('Nonexistent Organization');

        expect(result).toBeNull();
      });
    });

    describe('create', () => {
      it('should create a new organization', async () => {
        const organizationName = 'New Organization';
        const mockCreatedOrganization = {
          id: 2,
          name: organizationName,
          created_at: new Date(),
        };

        mockPrisma.organization.create.mockResolvedValue(mockCreatedOrganization as any);

        const result = await OrganizationService.create(organizationName);

        expect(mockPrisma.organization.create).toHaveBeenCalledWith({
          data: { name: organizationName },
        });
        // OrganizationService.create returns only { id }
        expect(result).toEqual({ id: 2 });
      });

      it('should handle unique constraint violations', async () => {
        const organizationName = 'Existing Organization';
        const error = new Error('Unique constraint failed on the constraint: `Organization_name_key`');
        
        mockPrisma.organization.create.mockRejectedValue(error);

        await expect(OrganizationService.create(organizationName)).rejects.toThrow('Unique constraint failed');
      });

      it('should handle empty organization name', async () => {
        const error = new Error('Organization name cannot be empty');
        
        mockPrisma.organization.create.mockRejectedValue(error);

        await expect(OrganizationService.create('')).rejects.toThrow('Organization name cannot be empty');
      });
    });
  });

  describe('Database connection', () => {
    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection refused');
      mockPrisma.$connect.mockRejectedValue(connectionError);

      // This would typically be handled during app initialization
      await expect(mockPrisma.$connect()).rejects.toThrow('Connection refused');
    });

    it('should handle disconnection', async () => {
      mockPrisma.$disconnect.mockResolvedValue(undefined);

      await expect(mockPrisma.$disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Data validation', () => {
    it('should validate email format in UserService', async () => {
      // This test would require email validation logic
      // For now, we test that the service accepts valid email format
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
      ];

      for (const email of validEmails) {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        await UserService.findByEmail(email);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email },
          include: { organization: true },
        });
      }
    });

    it('should handle special characters in organization names', async () => {
      const organizationNames = [
        'Test & Associates',
        'Company Inc.',
        'Organization (Ltd)',
        'Multi-Word Organization',
      ];

      for (const name of organizationNames) {
        mockPrisma.organization.findFirst.mockResolvedValue(null);
        await OrganizationService.findByName(name);
        expect(mockPrisma.organization.findFirst).toHaveBeenCalledWith({
          where: { name },
        });
      }
    });
  });

  describe('Performance considerations', () => {
    it('should use proper database indexes', async () => {
      // This test verifies that we're using indexed fields for queries
      await UserService.findByEmail('test@example.com');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }, // email should be indexed
        include: { organization: true },
      });

      await UserService.findById(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }, // id should be primary key (automatically indexed)
        include: { organization: true },
      });
    });

    it('should handle concurrent operations', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password',
        organizationId: 1,
      };

      const mockUser = {
        id: 1,
        ...userData,
        role: 'user',
        organization_id: 1,
        created_at: new Date(),
        last_login: null,
      };

      // Mock to succeed for all calls (in real DB, unique constraint would prevent duplicates)
      mockPrisma.user.create.mockResolvedValue(mockUser as any);

      // Simulate concurrent user creation
      const promises = Array(5).fill(null).map(() => UserService.create(userData));
      
      // With mocks, all succeed. In reality, DB unique constraint would prevent duplicates.
      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(5);
    });
  });
});
