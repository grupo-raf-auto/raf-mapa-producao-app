import { Request, Response } from 'express';
import { ZodSchema } from 'zod';
import logger from '../lib/logger';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ApiResponse,
} from '../types/index';
import { BaseRepository } from '../repositories/base.repository';
import { debugLog } from '../utils/debug-log';

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
  protected resourceName = 'Entity';

  /**
   * Construir filtros WHERE a partir de query params
   * Implementar em subclass se necessário
   */
  protected buildWhere(query: any): any {
    return {};
  }

  /**
   * NEW: Aplicar model scoping aos filtros
   * Se o controller requer isolamento por modelo, adiciona filtro de modelContext
   * Override em subclass se necessário
   */
  protected applyModelScoping(where: any, user: any): any {
    if (this.requiresModelScoping && user?.activeModelType) {
      return {
        ...where,
        modelContext: user.activeModelType,
      };
    }
    return where;
  }

  /**
   * Flag: indica se este controller requer isolamento por modelo
   * Override em subclass se necessário (ex: FormSubmissionController)
   */
  protected requiresModelScoping = false;

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
    userRole: string,
  ): Promise<boolean> {
    // Admin sempre pode acessar
    if (userRole === 'admin') return true;

    // Verificar propriedade
    const itemData = item as Record<string, unknown>;
    if ('uploadedBy' in itemData) return itemData.uploadedBy === userId;
    if ('createdBy' in itemData) return itemData.createdBy === userId;
    if ('submittedBy' in itemData) return itemData.submittedBy === userId;
    if ('userId' in itemData) return itemData.userId === userId;

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
      const takeNum = Math.min(
        100,
        Math.max(1, parseInt(take as string) || 20),
      );

      // Construir filtros
      let where = this.buildWhere(query);

      // NEW: Aplicar model scoping se necessário
      const user = (req as any).user;
      where = this.applyModelScoping(where, user);

      // Buscar dados
      const items = await this.repository.findMany({
        where: Object.keys(where).length ? where : undefined,
        skip: skipNum,
        take: takeNum,
        orderBy: this.getOrderBy(query),
      });

      const total = await this.repository.count(
        Object.keys(where).length ? { where } : {},
      );

      logger.info(
        { count: items.length, total, resourceName: this.resourceName },
        `Listed ${this.resourceName}`,
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
        `Error listing ${this.resourceName}`,
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
        return res.status(404).json({
          success: false,
          error: `${this.resourceName} not found`,
        });
      }

      // Validar propriedade
      const user = (req as any).user;
      if (user) {
        const hasAccess = await this.validateOwnership(
          item,
          user.id,
          user.role,
        );
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: `Cannot access this ${this.resourceName}`,
          });
        }
      }

      logger.info(
        { id, resourceName: this.resourceName },
        `Retrieved ${this.resourceName}`,
      );

      const response: ApiResponse = {
        success: true,
        data: this.normalizeItem(item),
      };

      return res.json(response);
    } catch (error) {
      logger.error(
        { error, id: req.params.id, resourceName: this.resourceName },
        `Error retrieving ${this.resourceName}`,
      );
      return res.status(500).json({
        success: false,
        error: `Failed to retrieve ${this.resourceName}`,
      });
    }
  }

  /**
   * POST /api/resource - Criar novo
   */
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        throw new Error('Unauthorized');
      }

      // Validar schema e usar dados validados (defaults e coerções do Zod)
      let body = req.body;
      if (this.createSchema) {
        const validation = this.createSchema.safeParse(req.body);
        if (!validation.success) {
          const errors: Record<string, string[]> = {};
          // Usar .issues (propriedade correta do ZodError)
          validation.error.issues?.forEach((issue) => {
            const path = issue.path.join('.') || '_root';
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
          });
          logger.warn(
            {
              resourceName: this.resourceName,
              validationErrors: errors,
              body: req.body,
            },
            `Validation failed for ${this.resourceName} create`,
          );
          return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: errors,
          });
        }
        body = validation.data;
      }

      // Criar com userId do usuário autenticado
      const data = this.prepareCreateData(body, user.id);
      // #region agent log
      debugLog({
        location: 'base-crud.controller.ts:create',
        message: 'before repository.create',
        data: {
          resourceName: this.resourceName,
          hasTitle: !!(data as any).title,
          hasStatus: !!(data as any).status,
          optionsIsArray: Array.isArray((data as any).options),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'B',
      });
      // #endregion
      const item = await this.repository.create(data);
      // #region agent log
      debugLog({
        location: 'base-crud.controller.ts:create',
        message: 'after repository.create',
        data: { resourceName: this.resourceName, itemId: (item as any)?.id },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'B',
      });
      // #endregion

      logger.info(
        {
          id: (item as any).id,
          userId: user.id,
          resourceName: this.resourceName,
        },
        `Created ${this.resourceName}`,
      );

      const response: ApiResponse = {
        success: true,
        data: this.normalizeItem(item),
      };

      return res.status(201).json(response);
    } catch (error) {
      // #region agent log
      debugLog({
        location: 'base-crud.controller.ts:create catch',
        message: 'create error',
        data: {
          resourceName: this.resourceName,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'B',
      });
      // #endregion
      logger.error(
        { error, resourceName: this.resourceName },
        `Error creating ${this.resourceName}`,
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
        return res.status(404).json({
          success: false,
          error: `${this.resourceName} not found`,
        });
      }

      // Validar propriedade
      const hasAccess = await this.validateOwnership(item, user.id, user.role);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `Cannot update this ${this.resourceName}`,
        });
      }

      // Validar schema
      if (this.updateSchema) {
        const validation = this.updateSchema.safeParse(req.body);
        if (!validation.success) {
          const errors: Record<string, string[]> = {};
          // Usar .issues (propriedade correta do ZodError)
          validation.error.issues?.forEach((issue) => {
            const path = issue.path.join('.') || '_root';
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
          });
          logger.warn(
            {
              resourceName: this.resourceName,
              validationErrors: errors,
              body: req.body,
            },
            `Validation failed for ${this.resourceName} update`,
          );
          return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: errors,
          });
        }
      }

      // Atualizar
      const updated = await this.repository.update(id, req.body);

      logger.info(
        { id, userId: user.id, resourceName: this.resourceName },
        `Updated ${this.resourceName}`,
      );

      const response: ApiResponse = {
        success: true,
        data: this.normalizeItem(updated),
      };

      return res.json(response);
    } catch (error) {
      logger.error(
        { error, id: req.params.id, resourceName: this.resourceName },
        `Error updating ${this.resourceName}`,
      );
      return res.status(500).json({
        success: false,
        error: `Failed to update ${this.resourceName}`,
      });
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
        return res.status(404).json({
          success: false,
          error: `${this.resourceName} not found`,
        });
      }

      // Validar propriedade
      const hasAccess = await this.validateOwnership(item, user.id, user.role);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `Cannot delete this ${this.resourceName}`,
        });
      }

      // Deletar
      await this.repository.delete(id);

      logger.info(
        { id, userId: user.id, resourceName: this.resourceName },
        `Deleted ${this.resourceName}`,
      );

      const response: ApiResponse = {
        success: true,
        data: null,
      };

      return res.json(response);
    } catch (error) {
      logger.error(
        { error, id: req.params.id, resourceName: this.resourceName },
        `Error deleting ${this.resourceName}`,
      );
      return res.status(500).json({
        success: false,
        error: `Failed to delete ${this.resourceName}`,
      });
    }
  }

  // ============ HELPERS ============

  /**
   * Preparar dados para criação
   * Override em subclass para customizar
   */
  protected prepareCreateData(data: any, userId: string): any {
    // Adicionar userId automaticamente se o modelo tiver esse campo
    if ('userId' in data === false) {
      data.userId = userId;
    }
    if ('createdBy' in data === false) {
      data.createdBy = userId;
    }
    return data;
  }

  /**
   * Construir orderBy a partir de query
   */
  protected getOrderBy(query: any): any {
    const orderBy = query.orderBy || 'createdAt';
    const direction = query.orderDirection || 'desc';
    return { [orderBy]: direction };
  }
}
