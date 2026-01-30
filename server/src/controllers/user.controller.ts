import { Request, Response } from "express";
import { BaseCRUDController } from "./base-crud.controller";
import { UserRepository } from "../repositories/user.repository";
import { updateUserSchema } from "../schemas/index";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";
import { userStatsService } from "../services/user-stats.service";

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
  updateSchema = updateUserSchema;
  protected resourceName = "User";

  /**
   * GET /api/users/me - Obter usuário autenticado
   */
  async getCurrentUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const currentUser = await this.repository.findUnique(user.id);
      if (!currentUser) {
        throw new Error("User not found");
      }

      logger.info({ userId: user.id }, "Retrieved current user");

      const response = {
        success: true,
        data: this.normalizeItem(currentUser),
      };

      return res.json(response);
    } catch (error) {
      logger.error({ error }, "Error fetching current user");
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
      if (!user || user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Only admins can view stats" });
      }

      const stats = await userStatsService.generateStats();

      logger.info({ userId: user.id }, "Retrieved user stats");

      const response = {
        success: true,
        data: stats,
      };

      return res.json(response);
    } catch (error) {
      logger.error({ error }, "Error fetching user stats");
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
        "Criação de utilizadores via API não é suportada. Use o registo em /sign-up.",
    });
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
    userRole: string
  ): Promise<boolean> {
    // Admin sempre pode atualizar/deletar
    if (userRole === "admin") return true;
    // Usuários normais não podem deletar sua própria conta
    if (item.id === userId) return false;
    return true;
  }
}
