import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { UserRole } from '../constants';
import { sendBugReportEmail } from '../utils/email-bug';

export class TicketController {
  /** User: create bug report (ticket). Sends email to admin via Resend. */
  static async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { title, description } = req.body as {
        title?: string;
        description?: string;
      };
      const t = typeof title === 'string' ? title.trim() : '';
      const d = typeof description === 'string' ? description.trim() : '';

      if (!t || t.length < 3) {
        return res
          .status(400)
          .json({ error: 'O título deve ter pelo menos 3 caracteres.' });
      }
      if (!d || d.length < 10) {
        return res
          .status(400)
          .json({ error: 'A descrição deve ter pelo menos 10 caracteres.' });
      }

      const bug = await prisma.bugReport.create({
        data: {
          title: t.slice(0, 200),
          description: d.slice(0, 5000),
          reportedById: req.user.id,
        },
        include: {
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await sendBugReportEmail({
        reportId: bug.id,
        title: bug.title,
        description: bug.description,
        reporterName: bug.reportedBy.name ?? undefined,
        reporterEmail: bug.reportedBy.email,
      }).catch((err) => console.error('[ticket] Email send failed:', err));

      res.status(201).json({
        id: bug.id,
        title: bug.title,
        status: bug.status,
        createdAt: bug.createdAt,
      });
    } catch (error) {
      console.error('Error creating bug report:', error);
      res
        .status(500)
        .json({ error: 'Erro ao enviar o reporte. Tente novamente.' });
    }
  }

  /** Admin: list all bug reports (tickets). */
  static async getAll(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      if (req.user.role !== UserRole.admin) {
        return res
          .status(403)
          .json({ error: 'Apenas administradores podem listar tickets.' });
      }

      const status = req.query.status as string | undefined;
      const unreadOnly = req.query.unreadOnly === 'true';

      const where: { status?: string; readAt?: null } = {};
      if (status) where.status = status;
      if (unreadOnly) where.readAt = null;

      const tickets = await prisma.bugReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.json(tickets);
    } catch (error) {
      console.error('Error listing tickets:', error);
      res.status(500).json({ error: 'Erro ao carregar tickets.' });
    }
  }

  /** Admin: get one ticket by id. */
  static async getById(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      if (req.user.role !== UserRole.admin) {
        return res
          .status(403)
          .json({ error: 'Apenas administradores podem ver este ticket.' });
      }

      const { id } = req.params;
      const ticket = await prisma.bugReport.findUnique({
        where: { id },
        include: {
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!ticket)
        return res.status(404).json({ error: 'Ticket não encontrado.' });
      res.json(ticket);
    } catch (error) {
      console.error('Error getting ticket:', error);
      res.status(500).json({ error: 'Erro ao carregar ticket.' });
    }
  }

  /** Admin: mark as read and/or update status. */
  static async update(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      if (req.user.role !== UserRole.admin) {
        return res
          .status(403)
          .json({ error: 'Apenas administradores podem atualizar tickets.' });
      }

      const { id } = req.params;
      const { readAt, status } = req.body as {
        readAt?: boolean;
        status?: string;
      };

      const data: { readAt?: Date; status?: string } = {};
      if (readAt === true) data.readAt = new Date();
      if (status && ['open', 'in_progress', 'resolved'].includes(status))
        data.status = status;

      const ticket = await prisma.bugReport.update({
        where: { id },
        data,
        include: {
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.json(ticket);
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({ error: 'Erro ao atualizar ticket.' });
    }
  }
}
