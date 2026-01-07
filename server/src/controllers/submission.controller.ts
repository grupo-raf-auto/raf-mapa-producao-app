import { Request, Response } from 'express';
import { SubmissionModel } from '../models/submission.model';
import { FormSubmission } from '../types';

export class SubmissionController {
  static async getAll(req: Request, res: Response) {
    try {
      const templateId = req.query.templateId as string | undefined;
      const submissions = await SubmissionModel.findAll(
        templateId ? { templateId } : undefined
      );
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submission = await SubmissionModel.findById(id);

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      res.json(submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const submissionData: Omit<FormSubmission, '_id' | 'submittedAt'> = {
        templateId: req.body.templateId,
        answers: req.body.answers || [],
        submittedBy: req.body.submittedBy, // Opcional, para quando implementar login
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

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await SubmissionModel.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting submission:', error);
      res.status(500).json({ error: 'Failed to delete submission' });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const templateId = req.query.templateId as string | undefined;
      const total = await SubmissionModel.count(
        templateId ? { templateId } : undefined
      );
      res.json({ total });
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      res.status(500).json({ error: 'Failed to fetch submission stats' });
    }
  }
}
