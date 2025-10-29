// Mock implementation of database module for testing
// This uses the mocked @prisma/client from __mocks__/@prisma/client.ts

import { PrismaClient } from '@prisma/client';

// Export mock prisma instance using the mocked PrismaClient
export const prisma = new PrismaClient() as any;

// Export mock services
export const UserService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateLastLogin: jest.fn(),
};

export const OrganizationService = {
  findByName: jest.fn(),
  create: jest.fn(),
};

// Export mock functions
export const initializeDatabase = jest.fn();
export const closeDatabase = jest.fn();

