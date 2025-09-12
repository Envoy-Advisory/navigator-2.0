import { PrismaClient, User, Organization } from '@prisma/client';
import { loadEnvironment } from './env';

// Load environment variables first
loadEnvironment();

// Prisma client instance with proper configuration for serverless
export const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection retry wrapper
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = error?.code === 'P1001' || 
                               error?.code === 'P2024' || 
                               error?.message?.includes('terminating connection') ||
                               error?.message?.includes('connection terminated') ||
                               error?.message?.includes('Connection terminated unexpectedly');
      
      if (isConnectionError && attempt < maxRetries) {
        console.log(`Database connection lost, retrying attempt ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Export types from Prisma
export type { User, Organization };

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    await withRetry(async () => {
      await prisma.$connect();
      console.log('Database connected with Prisma');

      // Test the connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection test successful');
    });
  } catch (error) {
    console.error('Error connecting to database:', error);
    // Don't throw here to allow the server to start even if DB is temporarily unavailable
    console.log('Server will continue starting. Database operations will retry automatically.');
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
      return await withRetry(() => prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      }));
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      return await withRetry(() => prisma.user.findUnique({
        where: { id },
        include: { organization: true }
      }));
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
      return await withRetry(() => prisma.user.create({
        data: {
          name,
          email,
          password,
          organization_id: organizationId,
          last_login: new Date()
        },
        include: { organization: true }
      }));
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateLastLogin(id: number): Promise<void> {
    try {
      await withRetry(() => prisma.user.update({
        where: { id },
        data: { last_login: new Date() }
      }));
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }
}

// Organization operations
export class OrganizationService {
  static async findByName(name: string): Promise<Organization | null> {
    try {
      return await withRetry(() => prisma.organization.findFirst({
        where: { name }
      }));
    } catch (error) {
      console.error('Error finding organization by name:', error);
      throw error;
    }
  }

  static async create(name: string): Promise<{ id: number }> {
    try {
      const organization = await withRetry(() => prisma.organization.create({
        data: { name }
      }));
      return { id: organization.id };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Organization | null> {
    try {
      return await withRetry(() => prisma.organization.findUnique({
        where: { id },
        include: { users: true }
      }));
    } catch (error) {
      console.error('Error finding organization by id:', error);
      throw error;
    }
  }
}