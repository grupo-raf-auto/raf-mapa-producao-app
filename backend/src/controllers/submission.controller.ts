import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { StatsService } from '../services/stats.service';
import { withLegacyId, withLegacyIds } from '../utils/response.utils';

function getFormDateFromAnswers(
  answers: unknown,
  dataQuestionId: string | undefined,
): string | null {
  if (!dataQuestionId || !Array.isArray(answers)) return null;
  const entry = (answers as { questionId: string; answer: string }[]).find(
    (a) => a.questionId === dataQuestionId,
  );
  const value = entry?.answer?.trim();
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : value;
}

/** Rejeita se a resposta à questão "Data" for uma data futura. Retorna mensagem de erro ou null. */
function validateDataNotFuture(
  dataQuestionId: string | undefined,
  answers: { questionId: string; answer: string }[],
): string | null {
  if (!dataQuestionId) return null;
  const dataAnswer = answers.find((a) => a.questionId === dataQuestionId);
  if (!dataAnswer?.answer?.trim()) return null;
  const parsed = new Date(dataAnswer.answer.trim());
  if (isNaN(parsed.getTime())) return null;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed.getTime() > today.getTime()) {
    return 'A data não pode ser uma data futura.';
  }
  return null;
}

export class SubmissionController {
  static async getAll(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const templateId = req.query.templateId as string | undefined;
      const scope = req.query.scope as 'personal' | 'all' | undefined;
      const where: {
        templateId?: string;
        submittedBy?: string;
        modelContext?: string;
      } = {};

      if (templateId) where.templateId = templateId;

      // Scope-based filtering: only admins can use scope=all
      const isAdminViewingAll = scope === 'all' && req.user.role === 'admin';
      if (isAdminViewingAll) {
        // Admin viewing all data - no submittedBy filter, no modelContext filter
      } else {
        // Personal data (default) - filter by user and optionally by active model
        where.submittedBy = req.user.id;
        if (req.user.activeModelType) {
          where.modelContext = req.user.activeModelType;
        }
      }

      const submissions = await prisma.formSubmission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
      });

      const dataQuestion = await prisma.question.findFirst({
        where: { title: 'Data' },
        select: { id: true },
      });

      const submissionsWithFormDate = submissions.map((s) => {
        const formDate = getFormDateFromAnswers(s.answers, dataQuestion?.id);
        return { ...withLegacyId(s), formDate };
      });

      res.json(submissionsWithFormDate);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const submission = await prisma.formSubmission.findUnique({
        where: { id },
      });

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden: You can only view your own submissions',
        });
      }

      res.json(withLegacyId(submission));
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { templateId, answers } = req.body;

      if (!templateId) {
        return res.status(400).json({ error: 'templateId is required' });
      }

      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          error: 'At least one answer is required',
        });
      }

      // Verificar se o template existe
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        include: {
          questions: {
            include: { question: { select: { id: true, title: true } } },
          },
        },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const dataQuestionId = template.questions.find(
        (tq) => tq.question.title === 'Data',
      )?.questionId;
      const dataError = validateDataNotFuture(
        dataQuestionId,
        answers as { questionId: string; answer: string }[],
      );
      if (dataError) {
        return res.status(400).json({ error: dataError });
      }

      // NEW: Include modelContext and profile FK
      const data: any = {
        templateId,
        answers: answers as unknown as object,
        submittedBy: req.user.id,
        modelContext: req.user.activeModelType,
      };

      // Add profile FK based on model type
      if (req.user.activeModelType === 'credito' && req.user.activeModelId) {
        const userModel = await prisma.userModel.findUnique({
          where: { id: req.user.activeModelId },
          include: { creditoProfile: true },
        });
        if (userModel?.creditoProfile) {
          data.creditoProfileId = userModel.creditoProfile.id;
        }
      } else if (
        req.user.activeModelType === 'imobiliaria' &&
        req.user.activeModelId
      ) {
        const userModel = await prisma.userModel.findUnique({
          where: { id: req.user.activeModelId },
          include: { imobiliariaProfile: true },
        });
        if (userModel?.imobiliariaProfile) {
          data.imobiliariaProfileId = userModel.imobiliariaProfile.id;
        }
      } else if (
        req.user.activeModelType === 'seguro' &&
        req.user.activeModelId
      ) {
        const userModel = await prisma.userModel.findUnique({
          where: { id: req.user.activeModelId },
          include: { seguroProfile: true },
        });
        if (userModel?.seguroProfile) {
          data.seguroProfileId = userModel.seguroProfile.id;
        }
      }

      const submission = await prisma.formSubmission.create({
        data,
      });

      // Invalidate stats cache for this user and model
      StatsService.invalidateCache(req.user.id, req.user.activeModelType);

      res.status(201).json({ id: submission.id, success: true });
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({ error: 'Failed to create submission' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const submission = await prisma.formSubmission.findUnique({
        where: { id },
      });

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden: You can only edit your own submissions',
        });
      }

      const answers = req.body.answers ?? submission.answers;
      const answersArray = Array.isArray(answers)
        ? (answers as { questionId: string; answer: string }[])
        : [];

      if (answersArray.length > 0) {
        const templateWithQuestions = await prisma.template.findUnique({
          where: { id: submission.templateId },
          include: {
            questions: {
              include: { question: { select: { id: true, title: true } } },
            },
          },
        });
        const dataQuestionId = templateWithQuestions?.questions.find(
          (tq) => tq.question.title === 'Data',
        )?.questionId;
        const dataError = validateDataNotFuture(dataQuestionId, answersArray);
        if (dataError) {
          return res.status(400).json({ error: dataError });
        }
      }

      const data: { answers: object; commissionPaid?: boolean } = {
        answers: answers as object,
      };

      // Apenas admin pode alterar o estado de comissão paga
      if (req.body.commissionPaid !== undefined && req.user.role === 'admin') {
        data.commissionPaid = Boolean(req.body.commissionPaid);
      }

      const updated = await prisma.formSubmission.update({
        where: { id },
        data,
      });

      // Invalidate stats cache for this user and model
      StatsService.invalidateCache(req.user.id, req.user.activeModelType);

      res.json(withLegacyId(updated));
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({ error: 'Failed to update submission' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const submission = await prisma.formSubmission.findUnique({
        where: { id },
      });

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden: You can only delete your own submissions',
        });
      }

      await prisma.formSubmission.delete({ where: { id } });

      // Invalidate stats cache for this user and model
      StatsService.invalidateCache(req.user.id, req.user.activeModelType);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting submission:', error);
      res.status(500).json({ error: 'Failed to delete submission' });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const templateId = req.query.templateId as string | undefined;
      const detailed = req.query.detailed === 'true';
      const scope = req.query.scope as 'personal' | 'all' | undefined;
      const period = req.query.period as 'yearly' | 'monthly' | undefined;
      const granularity = req.query.granularity as
        | 'daily'
        | 'weekly'
        | 'monthly'
        | 'quarterly'
        | 'yearly'
        | undefined;

      const filters: {
        templateId?: string;
        submittedBy?: string;
        modelContext?: string;
        granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      } = {};
      if (templateId) filters.templateId = templateId;
      if (granularity) filters.granularity = granularity;

      // FIXED: Always filter by user for personal stats (default)
      // Only show all data when explicitly requested with scope=all AND user is admin
      if (scope === 'all' && req.user.role === 'admin') {
        // Admin viewing all data - no submittedBy filter
      } else {
        // Personal data - always filter by user
        filters.submittedBy = req.user.id;
      }

      // NEW: Filter by active model context
      if (req.user.activeModelType) {
        filters.modelContext = req.user.activeModelType;
      }

      // Handle period-based stats
      if (period === 'yearly') {
        const yearlyStats = await StatsService.getYearlyTotal(filters);
        return res.json(yearlyStats);
      }

      if (period === 'monthly') {
        const monthlyStats = await StatsService.getMonthlyTotal(filters);
        return res.json(monthlyStats);
      }

      if (detailed) {
        const salesStats = await StatsService.getSalesStats(filters);
        return res.json(salesStats);
      }

      const total = await StatsService.getSubmissionCount(filters);
      res.json({ total });
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      res.status(500).json({ error: 'Failed to fetch submission stats' });
    }
  }
}
