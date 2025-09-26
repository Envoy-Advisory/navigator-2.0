import { Request, Response } from 'express';
import { prisma as db, UserService } from '../database';
import { AuthenticatedRequest } from '../types';

const prismaClient: any = db as any;

export async function promoteAdminHandler(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const user = await UserService.findByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prismaClient.user.update({ where: { id: user.id }, data: { role: 'admin' } });
    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminGetModulesHandler(_req: AuthenticatedRequest, res: Response) {
  try {
    const modules = await prismaClient.module.findMany({ include: { articles: true }, orderBy: { moduleNumber: 'asc' } });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreateModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleNumber, moduleName } = req.body;
    if (!moduleNumber || !moduleName) return res.status(400).json({ error: 'Module number and name are required' });
    const module = await prismaClient.module.create({ data: { moduleNumber: parseInt(moduleNumber), moduleName } });
    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminUpdateModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { moduleNumber, moduleName } = req.body;
    const module = await prismaClient.module.update({ where: { id: parseInt(id) }, data: { moduleNumber: parseInt(moduleNumber), moduleName } });
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminDeleteModuleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await prismaClient.module.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminModuleArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId } = req.params;
    const articles = await prismaClient.article.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreateArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { moduleId, articleName, content } = req.body;
    if (!moduleId || !articleName || !content) return res.status(400).json({ error: 'Module ID, article name, and content are required' });
    const lastArticle = await prismaClient.article.findFirst({ where: { moduleId: parseInt(moduleId) }, orderBy: { position: 'desc' } as any, select: { position: true } as any });
    const nextPosition = ((lastArticle as any)?.position || 0) + 1;
    const article = await db.article.create({ data: { moduleId: parseInt(moduleId), articleName, content, position: nextPosition } as any });
    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reorderArticlesHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { articles } = req.body;
    if (!articles || !Array.isArray(articles)) return res.status(400).json({ error: 'Articles array is required' });
    if (articles.length === 0) return res.status(400).json({ error: 'Articles array cannot be empty' });

    for (const article of articles) {
      if (!article.id || typeof article.id !== 'number' || article.id <= 0) return res.status(400).json({ error: 'Invalid article ID' });
      if (typeof article.position !== 'number' || article.position < 1) return res.status(400).json({ error: 'Invalid article position' });
    }

    const articleIds = articles.map((a: any) => a.id);
    const existingArticles = await db.article.findMany({ where: { id: { in: articleIds } }, select: { id: true } });
    if (existingArticles.length !== articles.length) {
      const existingIds = existingArticles.map(a => a.id);
      const missingIds = articleIds.filter((id: number) => !existingIds.includes(id));
      return res.status(400).json({ error: `Articles not found: ${missingIds.join(', ')}` });
    }

    const updatePromises = articles.map((article: { id: number; position: number }) => prismaClient.article.update({ where: { id: article.id }, data: { position: article.position } as any }));
    const results = await prismaClient.$transaction(updatePromises);
    res.json({ message: 'Articles reordered successfully', updatedCount: results.length, articles: results.map((article: any) => ({ id: article.id, position: (article as any).position })) });
  } catch (error) {
    console.error('Error reordering articles:', error);
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) return res.status(404).json({ error: 'One or more articles not found' });
      if (error.message.includes('Unique constraint')) return res.status(400).json({ error: 'Position conflict detected' });
      return res.status(500).json({ error: `Server error: ${error.message}` });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { articleName, content } = req.body;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'Invalid article ID' });
    if (!articleName || !content) return res.status(400).json({ error: 'Article name and content are required' });
    const article = await prismaClient.article.update({ where: { id: parseInt(id) }, data: { articleName, content } });
    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) return res.status(404).json({ error: 'Article not found' });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteArticleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await prismaClient.article.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
