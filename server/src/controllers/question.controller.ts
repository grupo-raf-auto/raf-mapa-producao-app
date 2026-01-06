import { Request, Response } from 'express';
import { QuestionModel } from '../models/question.model';
import { Question } from '../types';

export class QuestionController {
  static async getAll(req: Request, res: Response) {
    try {
      const { category, status, search } = req.query;

      const questions = await QuestionModel.findAll({
        category: category as any,
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
      const questionData: Omit<Question, '_id' | 'createdAt' | 'updatedAt'> = {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        status: req.body.status,
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
      const { id } = req.params;
      await QuestionModel.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  }
}
