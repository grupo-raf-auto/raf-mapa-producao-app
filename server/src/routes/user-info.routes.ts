/**
 * User info routes: approval-status, role.
 * Use session cookie (better-auth) to return current user state for the frontend.
 */

import { Router, Request, Response } from 'express';
import { auth } from '../auth';
import { prisma } from '../lib/prisma';

const router = Router();

async function getSessionFromRequest(req: Request) {
  const { fromNodeHeaders } = await import('better-auth/node');
  return auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
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

export default router;
