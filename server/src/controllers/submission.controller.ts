import { Request, Response } from 'express';
import { SubmissionModel } from '../models/submission.model';
import { FormSubmission } from '../types';

export class SubmissionController {
  static async getAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const templateId = req.query.templateId as string | undefined;
      
      // Users só veem suas próprias submissões, admins veem todas
      const filters: any = templateId ? { templateId } : {};
      if (req.user.role !== 'admin') {
        filters.submittedBy = req.user.clerkId;
      }

      const submissions = await SubmissionModel.findAll(filters);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const submission = await SubmissionModel.findById(id);

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // Users só podem ver suas próprias submissões
      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.clerkId) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own submissions' });
      }

      res.json(submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const submissionData: Omit<FormSubmission, '_id' | 'submittedAt'> = {
        templateId: req.body.templateId,
        answers: req.body.answers || [],
        submittedBy: req.user.clerkId, // Sempre usar o usuário autenticado
      };

      // Validações básicas
      if (!submissionData.templateId) {
        return res.status(400).json({ error: 'templateId is required' });
      }

      if (!submissionData.answers || submissionData.answers.length === 0) {
        return res.status(400).json({ error: 'At least one answer is required' });
      }

      const id = await SubmissionModel.create(submissionData);
      res.status(201).json({ id, success: true });
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({ error: 'Failed to create submission' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const submission = await SubmissionModel.findById(id);

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // Users só podem editar suas próprias submissões
      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.clerkId) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own submissions' });
      }

      // Atualizar apenas as respostas
      const updatedData: Partial<FormSubmission> = {
        answers: req.body.answers || submission.answers,
      };

      console.log('Updating submission:', id, 'with data:', updatedData);
      const updatedSubmission = await SubmissionModel.update(id, updatedData);
      console.log('Updated submission:', updatedSubmission);
      
      res.json(updatedSubmission);
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({ error: 'Failed to update submission' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const submission = await SubmissionModel.findById(id);

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // Users só podem deletar suas próprias submissões
      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.clerkId) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own submissions' });
      }

      await SubmissionModel.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting submission:', error);
      res.status(500).json({ error: 'Failed to delete submission' });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const templateId = req.query.templateId as string | undefined;
      
      // Users só veem stats de suas submissões, admins veem todas
      const filters: any = templateId ? { templateId } : {};
      if (req.user.role !== 'admin') {
        filters.submittedBy = req.user.clerkId;
      }

      // Se pedir stats detalhadas, retornar sales stats
      const detailed = req.query.detailed === 'true';
      
      if (detailed) {
        const salesStats = await SubmissionModel.getSalesStats(filters);
        res.json(salesStats);
      } else {
        const total = await SubmissionModel.count(filters);
        res.json({ total });
      }
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      res.status(500).json({ error: 'Failed to fetch submission stats' });
    }
  }
}
