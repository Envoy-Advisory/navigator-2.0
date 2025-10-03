import { Request, Response } from 'express';
import { prisma as db } from '../database';

const prismaClient: any = db as any;

export async function moduleFormsHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;
    const forms = await prismaClient.form.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function moduleFormsAuthHandler(req: Request, res: Response) {
  try {
    const { moduleId } = req.params;
    const forms = await prismaClient.form.findMany({ where: { moduleId: parseInt(moduleId) }, orderBy: [ { position: 'asc' } as any, { created_at: 'asc' } ] });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching authenticated forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFormHandler(req: Request, res: Response) {
  try {
    const { moduleId, formName, questions } = req.body;
    const form = await prismaClient.form.create({ data: { moduleId: parseInt(moduleId), formName, questions, position: 0 } });
    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFormHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { formName, questions } = req.body;
    const form = await prismaClient.form.update({ where: { id: parseInt(id) }, data: { formName, questions, updated_at: new Date() } });
    res.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFormHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prismaClient.form.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reorderFormsHandler(req: Request, res: Response) {
  try {
    const { forms } = req.body;
    if (!forms || !Array.isArray(forms)) return res.status(400).json({ error: 'Invalid forms data' });
    await Promise.all(forms.map((form: any) => prismaClient.form.update({ where: { id: form.id }, data: { position: form.position } })));
    res.json({ message: 'Forms reordered successfully' });
  } catch (error) {
    console.error('Error reordering forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
