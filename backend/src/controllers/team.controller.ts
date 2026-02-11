import { Request, Response } from 'express';
import { TeamRepository } from '../repositories/team.repository';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';

const repository = new TeamRepository();

interface AuthUser {
  id: string;
  role: string;
}

/** GET /api/teams - List teams (active only for users; admin can pass ?all=true for all + members) */
export async function list(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    const all = (req.query.all as string) === 'true' && user?.role === 'admin';
    if (all) {
      const teams = await repository.findManyWithMembers({});
      return res.json(teams);
    }
    const where = { isActive: true };
    const teams = await repository.findMany(where);
    return res.json(
      Array.isArray(teams) ? teams : (teams as any).data ?? teams,
    );
  } catch (error) {
    logger.error({ error }, 'Team list error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** GET /api/teams/my - Current user's team */
export async function getMyTeam(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { teamId: true, team: true },
    });
    if (!u?.teamId || !u.team)
      return res.status(404).json({ error: 'No team assigned' });
    return res.json(u.team);
  } catch (error) {
    logger.error({ error }, 'Team getMyTeam error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** POST /api/teams/join - User joins a team (sets own teamId) */
export async function join(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { teamId } = req.body as { teamId?: string };
    if (!teamId || typeof teamId !== 'string')
      return res.status(400).json({ error: 'teamId is required' });
    const team = await repository.findUnique(teamId);
    if (!team || !team.isActive)
      return res.status(404).json({ error: 'Team not found or inactive' });
    await prisma.user.update({
      where: { id: user.id },
      data: { teamId },
    });
    logger.info({ userId: user.id, teamId }, 'User joined team');
    return res.json({ success: true, data: team });
  } catch (error) {
    logger.error({ error }, 'Team join error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** GET /api/teams/rankings - Team rankings (score = submission count) for podium */
export async function getRankings(req: Request, res: Response) {
  try {
    const submissions = await prisma.formSubmission.findMany({
      select: {
        id: true,
        submittedBy: true,
        user: { select: { teamId: true } },
      },
      where: { user: { teamId: { not: null } } },
    });
    const teamIds = new Set<string>();
    const scoreByTeam: Record<string, number> = {};
    for (const s of submissions) {
      const tid = s.user?.teamId;
      if (!tid) continue;
      teamIds.add(tid);
      scoreByTeam[tid] = (scoreByTeam[tid] || 0) + 1;
    }
    const teams = await prisma.team.findMany({
      where: { id: { in: Array.from(teamIds) }, isActive: true },
      select: { id: true, name: true, description: true },
    });
    const entries = teams
      .map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description ?? undefined,
        score: scoreByTeam[t.id] || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));
    return res.json(entries);
  } catch (error) {
    logger.error({ error }, 'Team rankings error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** GET /api/teams/:id/members - Get team members (admin only). Must be registered before GET /:id */
export async function getMembers(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const team = await repository.findUnique(id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const members = await repository.findMembers(id);
    return res.json(members);
  } catch (error) {
    logger.error({ error }, 'Team getMembers error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** GET /api/teams/:id - Get one team */
export async function getOne(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const team = await repository.findUnique(id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    return res.json(team);
  } catch (error) {
    logger.error({ error }, 'Team getOne error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** POST /api/teams - Create team (admin only) */
export async function create(req: Request, res: Response) {
  try {
    const body = req.body as { name?: string; description?: string };
    if (!body.name || typeof body.name !== 'string' || !body.name.trim())
      return res.status(400).json({ error: 'name is required' });
    const team = await repository.create({
      name: body.name.trim(),
      description:
        typeof body.description === 'string' ? body.description.trim() : undefined,
    });
    logger.info({ teamId: team.id, name: team.name }, 'Team created');
    return res.status(201).json(team);
  } catch (error) {
    logger.error({ error }, 'Team create error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** PATCH /api/teams/:id - Update team (admin only) */
export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body as { name?: string; description?: string; isActive?: boolean };
    const team = await repository.findUnique(id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const data: { name?: string; description?: string; isActive?: boolean } = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.description === 'string') data.description = body.description.trim() || null;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    const updated = await repository.update(id, data);
    return res.json(updated);
  } catch (error) {
    logger.error({ error }, 'Team update error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** DELETE /api/teams/:id - Delete team (admin only). Sets members' teamId to null. */
export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const team = await repository.findUnique(id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    await prisma.user.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await repository.delete(id);
    logger.info({ teamId: id }, 'Team deleted');
    return res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Team delete error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
