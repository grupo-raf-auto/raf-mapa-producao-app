import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';

interface AuthUser {
  id: string;
  role: string;
}

/** GET /api/objectives - List objectives (tree by teamId, null = global). User: read-only. Admin: full. */
export async function list(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const teamId = req.query.teamId as string | undefined;

    const objectives = await prisma.objective.findMany({
      where: { teamId: teamId || null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const buildTree = (parentId: string | null): (typeof objectives[0] & { children: typeof objectives })[] => {
      return objectives
        .filter((o) => o.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((o) => ({
          ...o,
          children: buildTree(o.id),
        }));
    };

    const tree = buildTree(null);
    return res.json(tree);
  } catch (error) {
    logger.error({ error }, 'Objective list error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** GET /api/objectives/flat - Flat list for tree building (admin) */
export async function listFlat(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const teamId = req.query.teamId as string | undefined;

    const objectives = await prisma.objective.findMany({
      where: { teamId: teamId || null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return res.json(objectives);
  } catch (error) {
    logger.error({ error }, 'Objective listFlat error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** POST /api/objectives - Create objective (admin only) */
export async function create(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const body = req.body as { title: string; description?: string; parentId?: string; teamId?: string; order?: number };
    if (!body.title || typeof body.title !== 'string' || !body.title.trim())
      return res.status(400).json({ error: 'title is required' });

    const objective = await prisma.objective.create({
      data: {
        title: body.title.trim(),
        description: typeof body.description === 'string' ? body.description.trim() || null : null,
        parentId: body.parentId || null,
        teamId: body.teamId || null,
        order: typeof body.order === 'number' ? body.order : 0,
      },
    });

    logger.info({ id: objective.id, teamId: objective.teamId }, 'Objective created');
    return res.status(201).json(objective);
  } catch (error) {
    logger.error({ error }, 'Objective create error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** PATCH /api/objectives/:id - Update objective (admin only) */
export async function update(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    const body = req.body as { title?: string; description?: string; parentId?: string; order?: number };

    const existing = await prisma.objective.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Objective not found' });

    const data: { title?: string; description?: string | null; parentId?: string | null; order?: number } = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (typeof body.description === 'string') data.description = body.description.trim() || null;
    if (body.parentId !== undefined) data.parentId = body.parentId || null;
    if (typeof body.order === 'number') data.order = body.order;

    const objective = await prisma.objective.update({
      where: { id },
      data,
    });

    return res.json(objective);
  } catch (error) {
    logger.error({ error }, 'Objective update error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** DELETE /api/objectives/:id - Delete objective (admin only, cascades to children) */
export async function remove(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    await prisma.objective.delete({ where: { id } });

    logger.info({ id }, 'Objective deleted');
    return res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Objective delete error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** POST /api/objectives/reorder - Reorder objectives (admin only) */
export async function reorder(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const body = req.body as { updates: { id: string; order: number; parentId?: string | null }[] };
    if (!Array.isArray(body.updates)) return res.status(400).json({ error: 'updates array required' });

    await prisma.$transaction(
      body.updates.map((u) =>
        prisma.objective.update({
          where: { id: u.id },
          data: {
            order: u.order,
            ...(u.parentId !== undefined && { parentId: u.parentId }),
          },
        })
      )
    );

    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Objective reorder error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
