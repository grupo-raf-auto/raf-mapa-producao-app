import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class TemplateController {
  static async getAll(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const templates = await prisma.template.findMany({
        orderBy: { createdAt: 'desc' },
      });
      const filtered =
        req.user.role === 'admin'
          ? templates
          : templates.filter(
              (t) =>
                t.isPublic ||
                t.isDefault ||
                t.createdBy === req.user?.id
            );
      res.json(filtered.map((t) => ({ ...t, _id: t.id })));
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await prisma.template.findUnique({ where: { id } });
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json({ ...template, _id: template.id });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { title, description, questions, isPublic } = req.body;
      const template = await prisma.template.create({
        data: {
          title,
          description,
          questions: questions || [],
          isPublic: isPublic || false,
          createdBy: req.user.id,
        },
      });
      res.status(201).json({ id: template.id });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, questions, isPublic } = req.body;
      const data: Record<string, unknown> = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (questions !== undefined) data.questions = questions;
      if (isPublic !== undefined) data.isPublic = isPublic;
      await prisma.template.update({
        where: { id },
        data: data as Parameters<typeof prisma.template.update>[0]['data'],
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const template = await prisma.template.findUnique({ where: { id } });
      if (!template) return res.status(404).json({ error: 'Template not found' });
      if (template.isDefault) {
        return res.status(400).json({ error: 'Não é possível excluir templates padrão do sistema' });
      }
      if (req.user.role !== 'admin' && template.createdBy !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own templates' });
      }
      await prisma.template.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  }
}
