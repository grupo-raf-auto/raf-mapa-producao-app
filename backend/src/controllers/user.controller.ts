import { Request, Response } from 'express';
import { BaseCRUDController } from './base-crud.controller';
import { UserRepository } from '../repositories/user.repository';
import { updateUserSchema } from '../schemas/index';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';
import { userStatsService } from '../services/user-stats.service';
import { UserApprovalStatus } from '../constants';

/**
 * UserController
 *
 * Refatorado para usar BaseCRUDController
 * - CRUD genérico herdado de BaseCRUDController
 * - Métodos customizados: getCurrentUser, getStats
 * - Validação Zod centralizada
 * - Lógica complexa movida para UserStatsService
 */
export class UserController extends BaseCRUDController<any> {
  repository = new UserRepository(prisma);
  createSchema = undefined;
  updateSchema = updateUserSchema;
  protected resourceName = 'User';

  protected buildWhere(query: { withoutTeam?: string }): any {
    const where: Record<string, unknown> = {};
    if (query.withoutTeam === 'true') {
      where.teamId = null;
      where.status = 'approved';
      where.isActive = true;
    }
    return where;
  }

  /**
   * GET /api/users/me - Obter usuário autenticado
   */
  async getCurrentUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const currentUser = await this.repository.findUnique(user.id);
      if (!currentUser) {
        throw new Error('User not found');
      }

      logger.info({ userId: user.id }, 'Retrieved current user');

      const response = {
        success: true,
        data: this.normalizeItem(currentUser),
      };

      return res.json(response);
    } catch (error) {
      logger.error({ error }, 'Error fetching current user');
      throw error;
    }
  }

  /**
   * GET /api/users/stats - Obter estatísticas agregadas
   * Requer role: admin
   */
  async getStats(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can view stats' });
      }

      const stats = await userStatsService.generateStats();

      logger.info({ userId: user.id }, 'Retrieved user stats');

      const response = {
        success: true,
        data: stats,
      };

      return res.json(response);
    } catch (error) {
      logger.error({ error }, 'Error fetching user stats');
      throw error;
    }
  }

  /**
   * POST /api/users - Criar usuário desabilitado
   * Usuários são criados via Better Auth, não via API
   */
  async create(req: Request, res: Response) {
    return res.status(400).json({
      success: false,
      error:
        'Criação de utilizadores via API não é suportada. Use o registo em /sign-up.',
    });
  }

  /**
   * PATCH /api/users/:id - Atualizar utilizador
   * Ao aprovar/rejeitar, preenche approvedAt/approvedBy ou rejectedAt/rejectedBy/rejectionReason.
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const item = await this.repository.findUnique(id);
      if (!item) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hasAccess = await this.validateOwnership(item, user.id, user.role);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (this.updateSchema) {
        const validation = this.updateSchema.safeParse(req.body);
        if (!validation.success) {
          const errors: Record<string, string[]> = {};
          const zodErrors = validation.error as any;
          zodErrors.errors?.forEach((err: any) => {
            const path = err.path.join('.');
            if (!errors[path]) errors[path] = [];
            errors[path].push(err.message);
          });
          return res.status(400).json({ error: 'Validation failed', errors });
        }
      }

      const body = { ...req.body } as Record<string, unknown>;

      // Aprovação: preencher approvedAt, approvedBy e limpar rejeição
      if (body.status === UserApprovalStatus.approved) {
        body.approvedAt = new Date();
        body.approvedBy = user.id;
        body.rejectedAt = null;
        body.rejectedBy = null;
        body.rejectionReason = null;
      }

      // Rejeição: motivo obrigatório; preencher rejectedAt, rejectedBy e limpar aprovação
      if (body.status === UserApprovalStatus.rejected) {
        const reason = (body.rejectionReason as string)?.trim()?.slice(0, 500);
        if (!reason) {
          return res.status(400).json({
            error: 'Motivo da rejeição é obrigatório (máx. 500 caracteres).',
          });
        }
        body.rejectedAt = new Date();
        body.rejectedBy = user.id;
        body.rejectionReason = reason;
        body.approvedAt = null;
        body.approvedBy = null;
      }

      // Apenas admin pode alterar teamId e teamRole de um utilizador
      if (user.role !== 'admin') {
        delete body.teamId;
        delete body.teamRole;
      }

      const updated = await this.repository.update(id, body);

      logger.info({ id, userId: user.id, status: body.status }, 'Updated user');

      return res.json({
        success: true,
        data: this.normalizeItem(updated),
      });
    } catch (error) {
      logger.error({ error, id: req.params.id }, 'Error updating user');
      throw error;
    }
  }

  /**
   * Normalizar resposta (adicionar campos legado)
   */
  protected normalizeItem(item: any): any {
    return {
      ...item,
      _id: item.id,
      clerkId: item.id,
    };
  }

  protected normalizeItems(items: any[]): any[] {
    return items.map((item) => this.normalizeItem(item));
  }

  /**
   * Validar que usuário não pode deletar sua própria conta
   */
  protected async validateOwnership(
    item: any,
    userId: string,
    userRole: string,
  ): Promise<boolean> {
    // Admin sempre pode atualizar/deletar
    if (userRole === 'admin') return true;
    // Usuários normais não podem deletar sua própria conta
    if (item.id === userId) return false;
    return true;
  }
}
