
import { PrismaClient, User, Organization } from '@prisma/client';

// Prisma client instance
export const prisma = new PrismaClient();

// Export types from Prisma
export type { User, Organization };

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Database connected with Prisma');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

// Reset database and apply schema
export async function resetDatabase(): Promise<void> {
  try {
    console.log('Resetting database...');
    
    // Delete all data in correct order (respecting foreign keys)
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    
    console.log('Database reset completed');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

// Cleanup function for graceful shutdown
export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// User operations
export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });
  }

  static async findById(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: { organization: true }
    });
  }

  static async create(userData: {
    name: string;
    email: string;
    password: string;
    organizationId?: number;
  }): Promise<User> {
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
  }

  static async updateLastLogin(id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { last_login: new Date() }
    });
  }
}

// Organization operations
export class OrganizationService {
  static async create(name: string): Promise<{ id: number }> {
    const organization = await prisma.organization.create({
      data: { name }
    });
    return { id: organization.id };
  }

  static async findById(id: number): Promise<Organization | null> {
    return await prisma.organization.findUnique({
      where: { id },
      include: { users: true }
    });
  }
}
