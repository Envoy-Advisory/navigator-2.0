import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnvVar } from '../env';
import { AuthenticatedRequest } from '../types';

const JWT_SECRET = getEnvVar('JWT_SECRET', 'your-secret-key');

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader as string).split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    req.user = user as any;
    next();
  });
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export const validateSameOrganization = (UserService: any) => async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUser = await UserService.findById(req.user!.userId);
    
    if (!currentUser || !currentUser.organization_id) {
      res.status(403).json({ error: 'User must belong to an organization' });
      return;
    }

    if (targetUserId) {
      const targetUser = await UserService.findById(parseInt(targetUserId));
      if (!targetUser || targetUser.organization_id !== currentUser.organization_id) {
        res.status(403).json({ error: 'Access denied: users must be in the same organization' });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Organization validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
