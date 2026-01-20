import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class QuestionController {
  static async getAll(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      const where: { status?: string; OR?: { title?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }[] } = {};
      if (status && typeof status === 'string') where.status = status;
      if (search && typeof search === 'string') {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      const questions = await prisma.question.findMany({
        where: Object.keys(where).length ? where : undefined,
        orderBy: { createdAt: 'desc' },
      });
      res.json(questions.map((q) => ({ ...q, _id: q.id })));
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const question = await prisma.question.findUnique({ where: { id } });
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json({ ...question, _id: question.id });
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({ error: 'Failed to fetch question' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { title, description, status, inputType, options } = req.body;
      const question = await prisma.question.create({
        data: {
          title,
          description,
          status: status || 'active',
          inputType,
          options: options || [],
          createdBy: req.user.id,
        },
      });
      res.status(201).json({ id: question.id });
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ error: 'Failed to create question' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, status, inputType, options } = req.body;
      const data: Record<string, unknown> = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (status !== undefined) data.status = status;
      if (inputType !== undefined) data.inputType = inputType;
      if (options !== undefined) data.options = options;
      await prisma.question.update({
        where: { id },
        data: data as Parameters<typeof prisma.question.update>[0]['data'],
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ error: 'Failed to update question' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const question = await prisma.question.findUnique({ where: { id } });
      if (!question) return res.status(404).json({ error: 'Question not found' });
      if (req.user.role !== 'admin' && question.createdBy !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own questions' });
      }
      await prisma.question.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  }
}
