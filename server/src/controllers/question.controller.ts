import { Request, Response } from 'express';
import { QuestionModel } from '../models/question.model';
import { Question } from '../types';

export class QuestionController {
  static async getAll(req: Request, res: Response) {
    try {
      const { status, search } = req.query;

      const questions = await QuestionModel.findAll({
        status: status as any,
        search: search as string,
      });

      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const question = await QuestionModel.findById(id);

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.json(question);
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({ error: 'Failed to fetch question' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const questionData: Omit<Question, '_id' | 'createdAt' | 'updatedAt'> = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        inputType: req.body.inputType,
        options: req.body.options,
        createdBy: req.user.clerkId,
      };

      const id = await QuestionModel.create(questionData);
      res.status(201).json({ id });
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ error: 'Failed to create question' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await QuestionModel.update(id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ error: 'Failed to update question' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const question = await QuestionModel.findById(id);

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Users só podem deletar suas próprias questões, admins podem deletar qualquer
      if (req.user.role !== 'admin' && question.createdBy !== req.user.clerkId) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own questions' });
      }

      await QuestionModel.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  }
}
