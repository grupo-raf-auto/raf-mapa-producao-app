import { Request, Response } from "express";
import { ZodSchema } from "zod";
import logger from "../lib/logger";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ApiResponse,
} from "../types/index";
import { BaseRepository } from "../repositories/base.repository";

/**
 * Controller base genérico para operações CRUD
 * Elimina duplicação e fornece métodos padrão
 *
 * Exemplo de uso:
 * class QuestionController extends BaseCRUDController<Question> {
 *   repository = new QuestionRepository(prisma);
 *   createSchema = createQuestionSchema;
 *   updateSchema = updateQuestionSchema;
 *
 *   buildWhere(query: any) {
 *     return { status: query.status };
 *   }
 * }
 */
export abstract class BaseCRUDController<T> {
  abstract repository: BaseRepository<T>;
  abstract createSchema?: ZodSchema;
  abstract updateSchema?: ZodSchema;
  protected resourceName = "Entity";

  /**
   * Construir filtros WHERE a partir de query params
   * Implementar em subclass se necessário
   */
  protected buildWhere(query: any): any {
    return {};
  }

  /**
   * Normalizar resposta de um item
   * Implementar em subclass para customizar (ex: adicionar _id)
   */
  protected normalizeItem(item: T): any {
    return item;
  }

  /**
   * Normalizar resposta de múltiplos itens
   */
  protected normalizeItems(items: T[]): T[] {
    return items.map((item) => this.normalizeItem(item)) as T[];
  }

  /**
   * Validar acesso ao recurso por usuário
   * Implementar em subclass para regras customizadas
   * Retornar true = acesso permitido, false = negado
   */
  protected async validateOwnership(
    item: T | Record<string, unknown>,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // Admin sempre pode acessar
    if (userRole === "admin") return true;

    // Verificar propriedade
    const itemData = item as Record<string, unknown>;
    if ("uploadedBy" in itemData) return itemData.uploadedBy === userId;
    if ("createdBy" in itemData) return itemData.createdBy === userId;
    if ("submittedBy" in itemData) return itemData.submittedBy === userId;
    if ("userId" in itemData) return itemData.userId === userId;

    // Sem validação específica = permitir
    return true;
  }

  /**
   * GET /api/resource - Listar todos com filtros
   */
  async getAll(req: Request, res: Response) {
    try {
      const { skip = 0, take = 20, ...query } = req.query;

      // Paginação
      const skipNum = Math.max(0, parseInt(skip as string) || 0);
      const takeNum = Math.min(100, Math.max(1, parseInt(take as string) || 20));

      // Construir filtros
      const where = this.buildWhere(query);

      // Buscar dados
      const items = await this.repository.findMany({
        where: Object.keys(where).length ? where : undefined,
        skip: skipNum,
        take: takeNum,
        orderBy: this.getOrderBy(query),
      });

      const total = await this.repository.count(
        Object.keys(where).length ? { where } : {}
      );

      logger.info(
        { count: items.length, total, resourceName: this.resourceName },
        `Listed ${this.resourceName}`
      );

      const response: ApiResponse = {
        success: true,
        data: {
          items: this.normalizeItems(items),
          total,
          skip: skipNum,
          take: takeNum,
          hasMore: skipNum + takeNum < total,
        },
      };

      return res.json(response);
    } catch (error) {
      logger.error(
        { error, resourceName: this.resourceName },
        `Error listing ${this.resourceName}`
      );
      throw error;
    }
  }

  /**
   * GET /api/resource/:id - Buscar um item por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await this.repository.findUnique(id);

      if (!item) {
        throw new NotFoundError(this.resourceName, id);
      }

      // Validar propriedade
      const user = (req as any).user;
      if (user) {
        const hasAccess = await this.validateOwnership(
          item,
          user.id,
          user.role
        );
        if (!hasAccess) {
          throw new ForbiddenError(`Cannot access this ${this.resourceName}`);
        }
      }

      logger.info({ id, resourceName: this.resourceName }, `Retrieved ${this.resourceName}`);

      const response: ApiResponse = {
        success: true,
        data: this.normalizeItem(item),
      };

      return res.json(response);
    } catch (error) {
      logger.error(
        { error, id: req.params.id, resourceName: this.resourceName },
        `Error retrieving ${this.resourceName}`
      );
      throw error;
    }
  }

  /**
   * POST /api/resource - Criar novo
   */
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        throw new Error("Unauthorized");
      }

      // Validar schema
      if (this.createSchema) {
        const validation = this.createSchema.safeParse(req.body);
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
      }

      // Criar com userId do usuário autenticado
      const data = this.prepareCreateData(req.body, user.id);
      const item = await this.repository.create(data);

      logger.info(
        { id: (item as any).id, userId: user.id, resourceName: this.resourceName },
        `Created ${this.resourceName}`
      );

      const response: ApiResponse = {
        success: true,
        data: this.normalizeItem(item),
      };

      return res.status(201).json(response);
    } catch (error) {
      logger.error(
        { error, resourceName: this.resourceName },
        `Error creating ${this.resourceName}`
      );
      throw error;
    }
  }

  /**
   * PUT /api/resource/:id - Atualizar
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Buscar item existente
      const item = await this.repository.findUnique(id);
      if (!item) {
        throw new NotFoundError(this.resourceName, id);
      }

      // Validar propriedade
      const hasAccess = await this.validateOwnership(item, user.id, user.role);
      if (!hasAccess) {
        throw new ForbiddenError(`Cannot update this ${this.resourceName}`);
      }

      // Validar schema
      if (this.updateSchema) {
        const validation = this.updateSchema.safeParse(req.body);
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
      }

      // Atualizar
      const updated = await this.repository.update(id, req.body);

      logger.info(
        { id, userId: user.id, resourceName: this.resourceName },
        `Updated ${this.resourceName}`
      );

      const response: ApiResponse = {
        success: true,
        data: this.normalizeItem(updated),
      };

      return res.json(response);
    } catch (error) {
      logger.error(
        { error, id: req.params.id, resourceName: this.resourceName },
        `Error updating ${this.resourceName}`
      );
      throw error;
    }
  }

  /**
   * DELETE /api/resource/:id - Deletar
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Buscar item existente
      const item = await this.repository.findUnique(id);
      if (!item) {
        throw new NotFoundError(this.resourceName, id);
      }

      // Validar propriedade
      const hasAccess = await this.validateOwnership(item, user.id, user.role);
      if (!hasAccess) {
        throw new ForbiddenError(`Cannot delete this ${this.resourceName}`);
      }

      // Deletar
      await this.repository.delete(id);

      logger.info(
        { id, userId: user.id, resourceName: this.resourceName },
        `Deleted ${this.resourceName}`
      );

      const response: ApiResponse = {
        success: true,
        data: null,
      };

      return res.json(response);
    } catch (error) {
      logger.error(
        { error, id: req.params.id, resourceName: this.resourceName },
        `Error deleting ${this.resourceName}`
      );
      throw error;
    }
  }

  // ============ HELPERS ============

  /**
   * Preparar dados para criação
   * Override em subclass para customizar
   */
  protected prepareCreateData(data: any, userId: string): any {
    // Adicionar userId automaticamente se o modelo tiver esse campo
    if ("userId" in data === false) {
      data.userId = userId;
    }
    if ("createdBy" in data === false) {
      data.createdBy = userId;
    }
    return data;
  }

  /**
   * Construir orderBy a partir de query
   */
  protected getOrderBy(query: any): any {
    const orderBy = query.orderBy || "createdAt";
    const direction = query.orderDirection || "desc";
    return { [orderBy]: direction };
  }
}
