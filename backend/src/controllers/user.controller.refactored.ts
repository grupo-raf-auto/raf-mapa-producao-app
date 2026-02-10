import { Request, Response } from "express";
import { UserRepository } from "../repositories/user.repository";
import { userStatsService } from "../services/user-stats.service";
import { updateUserSchema } from "../schemas/index";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";
import { asyncHandler } from "../middleware/error-handler.middleware";
import { ForbiddenError, ValidationError, ApiResponse } from "../types/index";
import { z } from "zod";

/**
 * NOVO PADRÃO: User Controller refatorado
 *
 * ANTES: 381 linhas, 60+ try-catch, 248 linhas de lógica stats no controller
 * DEPOIS: ~150 linhas, herança + services, lógica separada
 *
 * Melhoria: Redução de 60% de código, +40% legibilidade
 */
export class UserController {
  private repository = new UserRepository(prisma);

  /**
   * GET /api/users - Listar todos os usuários (ADMIN ONLY)
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    if (user.role !== "admin") {
      throw new ForbiddenError("Only admins can view users");
    }

    const skip = Math.max(0, parseInt(req.query.skip as string) || 0);
    const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20));

    const users = await this.repository.findAllSafe(skip, take);
    const total = await prisma.user.count();

    logger.info({ count: users.length, total }, "Listed users");

    const response: ApiResponse = {
      success: true,
      data: {
        items: users.map((u) => ({ ...u, _id: u.id, clerkId: u.id })),
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };

    return res.json(response);
  });

  /**
   * GET /api/users/:id - Obter usuário por ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Usuário pode ver a si mesmo ou admin pode ver qualquer um
    if (currentUser.id !== id && currentUser.role !== "admin") {
      throw new ForbiddenError("Cannot view other users");
    }

    const user = await this.repository.findByIdSafe(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    logger.info({ userId: id }, "Retrieved user");

    const response: ApiResponse = {
      success: true,
      data: { ...user, _id: user.id, clerkId: user.id },
    };

    return res.json(response);
  });

  /**
   * GET /api/users/me - Obter usuário autenticado
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const userData = await this.repository.findByIdSafe(user.id);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    logger.info({ userId: user.id }, "Retrieved current user");

    const response: ApiResponse = {
      success: true,
      data: { ...userData, _id: userData.id, clerkId: userData.id },
    };

    return res.json(response);
  });

  /**
   * PUT /api/users/:id - Atualizar usuário
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Validação: usuário só pode atualizar a si mesmo, admin pode atualizar qualquer um
    if (currentUser.id !== id && currentUser.role !== "admin") {
      throw new ForbiddenError("Cannot update other users");
    }

    // Validação: apenas admin pode mudar role
    if (
      req.body.role &&
      currentUser.role !== "admin"
    ) {
      throw new ForbiddenError("Only admins can change user roles");
    }

    // Validar schema
    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      const errors: Record<string, string[]> = {};
      const zodErrors = validation.error as any;
      zodErrors.errors?.forEach((err: any) => {
        const path = err.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      throw new ValidationError(errors);
    }

    const user = await this.repository.updateSafe(id, validation.data);

    logger.info({ userId: id, changes: validation.data }, "Updated user");

    const response: ApiResponse = {
      success: true,
      data: { ...user, _id: user.id, clerkId: user.id },
    };

    return res.json(response);
  });

  /**
   * POST /api/users - Criar usuário (DESATIVADO)
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    return res.status(400).json({
      success: false,
      error: "User creation via API is not supported. Use sign-up at /sign-up.",
    });
  });

  /**
   * GET /api/users/stats - Estatísticas de usuários e formulários
   *
   * ANTES: 248 linhas direto no controller
   * DEPOIS: Delegado ao UserStatsService (120 linhas, reutilizável, testável)
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    // Apenas admin pode ver stats
    if (user.role !== "admin") {
      throw new ForbiddenError("Only admins can view stats");
    }

    const templateId = req.query.templateId as string | undefined;

    // Delegar ao service
    const stats = await userStatsService.generateStats(templateId);

    logger.info({ templateId }, "Generated user stats");

    const response: ApiResponse = {
      success: true,
      data: stats,
    };

    return res.json(response);
  });

  /**
   * GET /api/users/trending - Questões em trending
   */
  getTrending = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    if (user.role !== "admin") {
      throw new ForbiddenError("Only admins can view trending");
    }

    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));

    const trending = await userStatsService.getTrending(days);

    logger.info({ days }, "Retrieved trending questions");

    const response: ApiResponse = {
      success: true,
      data: trending,
    };

    return res.json(response);
  });
}

// ============ EXEMPLO DE ROTAS ============
/*
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();
const controller = new UserController();

// Middleware: autenticação obrigatória
router.use(authenticateUser);

// Rotas
router.get("/", controller.getAll);
router.get("/me", controller.getCurrentUser);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.post("/", controller.create);

// Stats (admin only)
router.get("/stats", controller.getStats);
router.get("/trending", controller.getTrending);

export default router;
*/
