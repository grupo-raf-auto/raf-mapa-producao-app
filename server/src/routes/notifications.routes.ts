import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { UserRole } from '../constants';

const router = Router();

/**
 * GET /api/notifications
 * Returns notification counts and summary for the current user.
 * - Admin: unread bug reports (tickets) count + list
 * - User: commissions paid count + recent list (submissions where commissionPaid = true)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.role === UserRole.admin) {
      const unreadBugs = await prisma.bugReport.count({
        where: { readAt: null },
      });
      const recentBugs = await prisma.bugReport.findMany({
        where: { readAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          reportedBy: { select: { name: true, email: true } },
        },
      });
      return res.json({
        kind: 'admin',
        unreadBugsCount: unreadBugs,
        recentBugs: recentBugs.map((b) => ({
          id: b.id,
          title: b.title,
          status: b.status,
          createdAt: b.createdAt,
          reporter: b.reportedBy,
        })),
      });
    }

    // User: commissions paid
    const commissionsPaidCount = await prisma.formSubmission.count({
      where: { submittedBy: req.user.id, commissionPaid: true },
    });
    const recentCommissions = await prisma.formSubmission.findMany({
      where: { submittedBy: req.user.id, commissionPaid: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        submittedAt: true,
        template: { select: { title: true } },
      },
    });

    return res.json({
      kind: 'user',
      commissionsPaidCount,
      recentCommissions: recentCommissions.map((s) => ({
        id: s.id,
        submittedAt: s.submittedAt,
        templateTitle: s.template?.title ?? 'Formulário',
      })),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Erro ao carregar notificações.' });
  }
});

export default router;
