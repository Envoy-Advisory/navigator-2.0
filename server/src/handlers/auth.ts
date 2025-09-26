import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma as db, UserService, OrganizationService } from '../database';
import { getEnvVar } from '../env';
import { AuthenticatedRequest } from '../types';

const prismaClient: any = db as any;
const JWT_SECRET = getEnvVar('JWT_SECRET', 'your-secret-key');

export async function registerHandler(req: Request, res: Response) {
  try {
    const { name, email, password, organization } = req.body;
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let organizationId: number | undefined = undefined;
    if (organization) {
      let existingOrg = await OrganizationService.findByName(organization);
      if (existingOrg) {
        organizationId = existingOrg.id;
      } else {
        const orgResult = await OrganizationService.create(organization);
        organizationId = orgResult.id;
      }
    }

    const user = await UserService.create({ name, email, password: hashedPassword, organizationId });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role } as any, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id?.toString(),
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await UserService.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    await UserService.updateLastLogin(user.id);

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role } as any, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id?.toString(),
        createdAt: user.created_at,
        lastLogin: new Date()
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await UserService.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id.toString(), name: user.name, email: user.email, role: user.role, organizationId: user.organization_id?.toString(), createdAt: user.created_at, lastLogin: user.last_login } });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function healthHandler(_req: Request, res: Response) {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
}
