import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

type Answer = { questionId: string; answer: string };

async function getSalesStats(filters: { templateId?: string; submittedBy?: string }) {
  const where: { templateId?: string; submittedBy?: string } = {};
  if (filters.templateId) where.templateId = filters.templateId;
  if (filters.submittedBy) where.submittedBy = filters.submittedBy;

  const submissions = await prisma.formSubmission.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
  });

  const allQuestions = await prisma.question.findMany({});
  const valorQuestion = allQuestions.find((q) => q.title === 'Valor');
  const bancoQuestion = allQuestions.find((q) => q.title === 'Banco');
  const seguradoraQuestion = allQuestions.find((q) => q.title === 'Seguradora');
  const distritoQuestion = allQuestions.find((q) => q.title === 'Distrito cliente');

  const valorQuestionId = valorQuestion?.id;
  const bancoQuestionId = bancoQuestion?.id;
  const seguradoraQuestionId = seguradoraQuestion?.id;
  const distritoQuestionId = distritoQuestion?.id;

  const stats = {
    total: submissions.length,
    totalValue: 0,
    averageValue: 0,
    byBanco: {} as Record<string, { count: number; totalValue: number }>,
    bySeguradora: {} as Record<string, { count: number; totalValue: number }>,
    byDistrito: {} as Record<string, { count: number; totalValue: number }>,
    byMonth: {} as Record<string, { count: number; totalValue: number }>,
  };

  let validValuesCount = 0;
  const answersArr = (a: unknown): Answer[] => (Array.isArray(a) ? a as Answer[] : []);

  for (const submission of submissions) {
    const answers = answersArr(submission.answers);
    let valor = 0;
    if (valorQuestionId) {
      const v = answers.find((x) => x.questionId === valorQuestionId);
      if (v?.answer) {
        const parsed = parseFloat(v.answer.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(parsed)) {
          valor = parsed;
          stats.totalValue += valor;
          validValuesCount++;
        }
      }
    }
    if (bancoQuestionId) {
      const b = answers.find((x) => x.questionId === bancoQuestionId);
      if (b?.answer) {
        const k = b.answer.trim();
        if (!stats.byBanco[k]) stats.byBanco[k] = { count: 0, totalValue: 0 };
        stats.byBanco[k].count++;
        stats.byBanco[k].totalValue += valor;
      }
    }
    if (seguradoraQuestionId) {
      const s = answers.find((x) => x.questionId === seguradoraQuestionId);
      if (s?.answer) {
        const k = s.answer.trim();
        if (!stats.bySeguradora[k]) stats.bySeguradora[k] = { count: 0, totalValue: 0 };
        stats.bySeguradora[k].count++;
        stats.bySeguradora[k].totalValue += valor;
      }
    }
    if (distritoQuestionId) {
      const d = answers.find((x) => x.questionId === distritoQuestionId);
      if (d?.answer) {
        const k = d.answer.trim();
        if (!stats.byDistrito[k]) stats.byDistrito[k] = { count: 0, totalValue: 0 };
        stats.byDistrito[k].count++;
        stats.byDistrito[k].totalValue += valor;
      }
    }
    if (submission.submittedAt) {
      const d = new Date(submission.submittedAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!stats.byMonth[monthKey]) stats.byMonth[monthKey] = { count: 0, totalValue: 0 };
      stats.byMonth[monthKey].count++;
      stats.byMonth[monthKey].totalValue += valor;
    }
  }

  stats.averageValue = validValuesCount > 0 ? stats.totalValue / validValuesCount : 0;

  return {
    total: stats.total,
    totalValue: stats.totalValue,
    averageValue: stats.averageValue,
    byBanco: Object.entries(stats.byBanco)
      .map(([name, data]) => ({ name, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => b.totalValue - a.totalValue),
    bySeguradora: Object.entries(stats.bySeguradora)
      .map(([name, data]) => ({ name, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => b.totalValue - a.totalValue),
    byDistrito: Object.entries(stats.byDistrito)
      .map(([name, data]) => ({ name, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => b.totalValue - a.totalValue),
    byMonth: Object.entries(stats.byMonth)
      .map(([month, data]) => ({ month, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}

export class SubmissionController {
  static async getAll(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const templateId = req.query.templateId as string | undefined;
      const where: { templateId?: string; submittedBy?: string } = {};
      if (templateId) where.templateId = templateId;
      if (req.user.role !== 'admin') where.submittedBy = req.user.id;

      const submissions = await prisma.formSubmission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
      });
      res.json(submissions.map((s) => ({ ...s, _id: s.id })));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const submission = await prisma.formSubmission.findUnique({ where: { id } });
      if (!submission) return res.status(404).json({ error: 'Submission not found' });
      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own submissions' });
      }
      res.json({ ...submission, _id: submission.id });
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { templateId, answers } = req.body;
      if (!templateId) return res.status(400).json({ error: 'templateId is required' });
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'At least one answer is required' });
      }
      const submission = await prisma.formSubmission.create({
        data: { templateId, answers: answers as unknown as object, submittedBy: req.user.id },
      });
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
      const submission = await prisma.formSubmission.findUnique({ where: { id } });
      if (!submission) return res.status(404).json({ error: 'Submission not found' });
      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own submissions' });
      }
      const answers = req.body.answers ?? submission.answers;
      const updated = await prisma.formSubmission.update({
        where: { id },
        data: { answers: answers as object },
      });
      res.json({ ...updated, _id: updated.id });
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({ error: 'Failed to update submission' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const submission = await prisma.formSubmission.findUnique({ where: { id } });
      if (!submission) return res.status(404).json({ error: 'Submission not found' });
      if (req.user.role !== 'admin' && submission.submittedBy !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own submissions' });
      }
      await prisma.formSubmission.delete({ where: { id } });
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
      const where: { templateId?: string; submittedBy?: string } = {};
      if (templateId) where.templateId = templateId;
      if (req.user.role !== 'admin') where.submittedBy = req.user.id;

      if (detailed) {
        const salesStats = await getSalesStats(where);
        return res.json(salesStats);
      }
      const total = await prisma.formSubmission.count({ where });
      res.json({ total });
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      res.status(500).json({ error: 'Failed to fetch submission stats' });
    }
  }
}
