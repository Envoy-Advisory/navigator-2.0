import { Request, Response } from 'express';
import { prisma as db } from '../database';

const prismaClient: any = db as any;

export async function publicModulesHandler(_req: Request, res: Response) {
  try {
    const modules = await prismaClient.module.findMany({ orderBy: { moduleNumber: 'asc' } });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching public modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function publicModuleArticlesHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;
    const articles = await prismaClient.article.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function publicArticleHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const article = await prismaClient.article.findUnique({ where: { id: parseInt(id) }, include: { module: true } });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    console.error('Error fetching public article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
