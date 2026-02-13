import { Request, Response } from 'express';
import { seedTemplatesAndQuestions } from '../scripts/seed-templates';

/**
 * POST /api/admin/seed
 * Restaura templates e questões iniciais.
 * Apenas admin. Não inclui dados dummy (submissions).
 */
export async function runSeed(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Apenas administradores podem executar o seed.',
      });
    }

    const result = await seedTemplatesAndQuestions({
      disconnect: false,
      silent: true,
    });

    res.json({
      success: true,
      created: {
        questions: result.questions.created,
        templates: result.templates.created,
      },
      skipped: {
        questions: result.questions.skipped,
        templates: result.templates.skipped,
      },
    });
  } catch (error) {
    console.error('Error running seed:', error);
    res.status(500).json({
      error: 'Erro ao executar seed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
