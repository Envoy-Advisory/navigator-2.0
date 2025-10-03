import { Request, Response } from 'express';
import { prisma as db, UserService } from '../database';
import { AuthenticatedRequest } from '../types';

const prismaClient: any = db as any;

export async function getFormResponseHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { formId } = req.params;
    const currentUser = await UserService.findById(req.user!.userId);
    if (!currentUser || !currentUser.organization_id) return res.status(403).json({ error: 'User must belong to an organization' });

    const response = await prismaClient.formResponse.findUnique({ where: { formId_organizationId: { formId: parseInt(formId), organizationId: currentUser.organization_id } }, include: { user: { select: { id: true, name: true, email: true } } } });
    res.json(response);
  } catch (error) {
    console.error('Error fetching form response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postFormResponseHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { formId } = req.params;
    const { answers } = req.body;
    const currentUser = await UserService.findById(req.user!.userId);
    if (!currentUser || !currentUser.organization_id) return res.status(403).json({ error: 'User must belong to an organization' });

    const response = await prismaClient.formResponse.upsert({ where: { formId_organizationId: { formId: parseInt(formId), organizationId: currentUser.organization_id } }, update: { answers, userId: currentUser.id, updated_at: new Date() }, create: { formId: parseInt(formId), organizationId: currentUser.organization_id, userId: currentUser.id, answers }, include: { user: { select: { id: true, name: true, email: true } } } });

    res.json(response);
  } catch (error) {
    console.error('Error saving form response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrganizationUsersHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const currentUser = await UserService.findById(req.user!.userId);
    if (!currentUser || !currentUser.organization_id) return res.status(403).json({ error: 'User must belong to an organization' });

    const organizationUsers = await prismaClient.user.findMany({ where: { organization_id: currentUser.organization_id }, select: { id: true, name: true, email: true } });
    res.json(organizationUsers);
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
