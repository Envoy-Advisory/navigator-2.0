import { PrismaClient, User, Organization } from '@prisma/client';
import { loadEnvironment } from './env';

// Load environment variables first
loadEnvironment();

// Prisma client instance with proper configuration for serverless
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Export types from Prisma
export type { User, Organization };

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Database connected with Prisma');

    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

// Cleanup function for graceful shutdown
export async function closeDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

// User operations
export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: { organization: true }
      });
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async create(userData: {
    name: string;
    email: string;
    password: string;
    organizationId?: number;
  }): Promise<User> {
    try {
      const { name, email, password, organizationId } = userData;
      return await prisma.user.create({
        data: {
          name,
          email,
          password,
          organization_id: organizationId,
          last_login: new Date()
        },
        include: { organization: true }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateLastLogin(id: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { last_login: new Date() }
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }
}

// Organization operations
export class OrganizationService {
  static async create(name: string): Promise<{ id: number }> {
    try {
      const organization = await prisma.organization.create({
        data: { name }
      });
      return { id: organization.id };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Organization | null> {
    try {
      return await prisma.organization.findUnique({
        where: { id },
        include: { users: true }
      });
    } catch (error) {
      console.error('Error finding organization by id:', error);
      throw error;
    }
  }
}

// Module operations
export class ModuleService {
  static async getAll() {
    try {
      return await prisma.module.findMany({
        include: { articles: true },
        orderBy: { moduleNumber: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching modules:', error);
      throw error;
    }
  }

  static async create(moduleData: { moduleNumber: number; moduleName: string }) {
    try {
      return await prisma.module.create({
        data: moduleData,
        include: { articles: true }
      });
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  static async update(id: number, moduleData: { moduleNumber?: number; moduleName?: string }) {
    try {
      return await prisma.module.update({
        where: { id },
        data: moduleData,
        include: { articles: true }
      });
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      return await prisma.module.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }
}

// Article operations
export class ArticleService {
  static async create(articleData: { moduleId: number; articleName: string; content: string }) {
    try {
      return await prisma.article.create({
        data: articleData,
        include: { module: true }
      });
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  static async update(id: number, articleData: { articleName?: string; content?: string }) {
    try {
      return await prisma.article.update({
        where: { id },
        data: articleData,
        include: { module: true }
      });
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      return await prisma.article.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }
}