/**
 * User info routes: approval-status, role, goal.
 * Use session cookie (better-auth) to return current user state for the frontend.
 */

import { Router, Request, Response } from 'express';
import { auth } from '../auth';
import { prisma } from '../lib/prisma';
import { StatsService } from '../services/stats.service';

const router = Router();

async function getSessionFromRequest(req: Request) {
  const { fromNodeHeaders } = await import('better-auth/node');
  return auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
}

/** Get active model type for current user from x-active-model header (model id) */
async function getActiveModelType(
  userId: string,
  req: Request,
): Promise<string | undefined> {
  const modelId = req.headers['x-active-model'] as string | undefined;
  if (!modelId) return undefined;
  const um = await prisma.userModel.findFirst({
    where: { id: modelId, userId },
    select: { modelType: true },
  });
  return um?.modelType;
}

/** GET /api/user/approval-status - detailed verification and approval state */
router.get('/approval-status', async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailVerified: true,
        status: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    return res.json({
      emailVerified: user.emailVerified,
      approvalStatus: user.status,
      approvedAt: user.approvedAt?.toISOString() ?? null,
      rejectedAt: user.rejectedAt?.toISOString() ?? null,
      rejectionReason: user.rejectionReason ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[api/user/approval-status]', error);
    return res
      .status(500)
      .json({ message: 'Erro ao obter estado de aprovação' });
  }
});

/** GET /api/user/role - role, approval status and emailVerified for redirect logic */
router.get('/role', async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    return res.json({
      role: user.role,
      approvalStatus: user.status,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error('[api/user/role]', error);
    return res
      .status(500)
      .json({ message: 'Erro ao obter dados do utilizador' });
  }
});

/** GET /api/user/goal - Obter objetivo do utilizador e progresso atual */
router.get('/goal', async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    const userId = session.user.id;
    const modelType = await getActiveModelType(userId, req);

    const goal = await prisma.userGoal.findUnique({
      where: { userId },
    });

    const filters = {
      submittedBy: userId,
      modelContext: modelType || undefined,
    };

    const [monthly, yearly] = await Promise.all([
      StatsService.getMonthlyTotal(filters),
      StatsService.getYearlyTotal(filters),
    ]);

    const targetValue = goal
      ? Number(goal.targetValue)
      : 0;
    const goalType = goal?.goalType ?? null;
    const period = goal?.period ?? 'monthly';

    let currentValue = 0;
    if (goalType === 'submissions_monthly' || goalType === 'policies_monthly') {
      currentValue = period === 'monthly' ? monthly.total : yearly.total;
    } else if (goalType === 'value_monthly') {
      currentValue =
        period === 'monthly' ? monthly.totalValue : yearly.totalValue;
    }

    const progressPercent =
      targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;

    return res.json({
      goal: goal
        ? {
            id: goal.id,
            goalType: goal.goalType,
            targetValue: targetValue,
            period: goal.period,
            createdAt: goal.createdAt.toISOString(),
            updatedAt: goal.updatedAt.toISOString(),
          }
        : null,
      progress: {
        currentValue,
        targetValue,
        progressPercent: Math.round(progressPercent * 10) / 10,
        monthlyTotal: monthly.total,
        monthlyValue: monthly.totalValue,
        yearlyTotal: yearly.total,
        yearlyValue: yearly.totalValue,
      },
    });
  } catch (error) {
    console.error('[api/user/goal]', error);
    return res
      .status(500)
      .json({ message: 'Erro ao obter objetivo e progresso' });
  }
});

/** PUT /api/user/goal - Definir ou atualizar objetivo do utilizador */
router.put('/goal', async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    const userId = session.user.id;

    const { goalType, targetValue, period } = req.body as {
      goalType?: string;
      targetValue?: number;
      period?: string;
    };

    const allowedTypes = [
      'submissions_monthly',
      'value_monthly',
      'policies_monthly',
    ];
    if (!goalType || !allowedTypes.includes(goalType)) {
      return res.status(400).json({
        message:
          'goalType obrigatório: submissions_monthly | value_monthly | policies_monthly',
      });
    }
    const value =
      typeof targetValue === 'number' && targetValue >= 0
        ? targetValue
        : 0;
    const periodValue =
      period === 'yearly' ? 'yearly' : 'monthly';

    const goal = await prisma.userGoal.upsert({
      where: { userId },
      create: {
        userId,
        goalType,
        targetValue: value,
        period: periodValue,
      },
      update: {
        goalType,
        targetValue: value,
        period: periodValue,
      },
    });

    return res.json({
      goal: {
        id: goal.id,
        goalType: goal.goalType,
        targetValue: Number(goal.targetValue),
        period: goal.period,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[api/user/goal PUT]', error);
    return res
      .status(500)
      .json({ message: 'Erro ao guardar objetivo' });
  }
});

export default router;
