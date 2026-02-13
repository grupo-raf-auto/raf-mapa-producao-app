import { prisma } from '../lib/prisma';
import type { Team, Prisma } from '@prisma/client';
import logger from '../lib/logger';

export class TeamRepository {
  async findMany(where?: Prisma.TeamWhereInput): Promise<Team[]> {
    return prisma.team.findMany({
      where: where ?? { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /** For admin: list teams with member count and member list (for initials). */
  async findManyWithMembers(where?: Prisma.TeamWhereInput) {
    return prisma.team.findMany({
      where: where ?? {},
      orderBy: { name: 'asc' },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            image: true,
            teamRole: true,
          },
        },
        _count: { select: { members: true } },
      },
    });
  }

  /** Get members of a team with profile photo, model metrics, and submission stats. */
  async findMembers(teamId: string) {
    const members = await prisma.user.findMany({
      where: { teamId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        image: true,
        teamRole: true,
        userModels: {
          where: { isActive: true },
          select: {
            id: true,
            modelType: true,
            creditoProfile: {
              select: {
                totalProduction: true,
                activeClients: true,
              },
            },
            imobiliariaProfile: {
              select: {
                totalSales: true,
                activeListings: true,
              },
            },
            seguroProfile: {
              select: {
                totalPremiums: true,
                activePolicies: true,
              },
            },
          },
        },
        submissions: {
          select: {
            id: true,
            commissionPaid: true,
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    // Adicionar contagens de submissões (aprovadas = commissionPaid true, pendentes = false)
    return members.map((member) => ({
      ...member,
      submissionsCount: member.submissions.length,
      approvedCount: member.submissions.filter((s) => s.commissionPaid).length,
      pendingCount: member.submissions.filter((s) => !s.commissionPaid).length,
      submissions: undefined, // Remover array completo
    }));
  }

  async findUnique(id: string): Promise<Team | null> {
    return prisma.team.findUnique({ where: { id } });
  }

  async create(data: Prisma.TeamCreateInput): Promise<Team> {
    return prisma.team.create({ data });
  }

  async update(id: string, data: Prisma.TeamUpdateInput): Promise<Team> {
    return prisma.team.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Team> {
    return prisma.team.delete({ where: { id } });
  }

  async countMembers(teamId: string): Promise<number> {
    return prisma.user.count({ where: { teamId } });
  }
}
