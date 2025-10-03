import { Request, Response } from 'express';
import { prisma as db } from '../database';
import { AuthenticatedRequest } from '../types';

const prismaClient: any = db as any;

export async function authenticatedModulesHandler(_req: AuthenticatedRequest, res: Response) {
  try {
    const modules = await prismaClient.module.findMany({ orderBy: [ { moduleNumber: 'asc' }, { created_at: 'asc' } ] });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching authenticated modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function authenticatedModuleArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId } = req.params;
    const articles = await prismaClient.article.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching authenticated articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
