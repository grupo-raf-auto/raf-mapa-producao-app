import { Request, Response } from "express";
import { BaseCRUDController } from "./base-crud.controller";
import { QuestionRepository } from "../repositories/question.repository";
import { createQuestionSchema, updateQuestionSchema } from "../schemas/index";
import { prisma } from "../lib/prisma";
import { withLegacyIds, withLegacyId } from "../utils/response.utils";
import logger from "../lib/logger";

/**
 * NOVO PADRÃO: Question Controller refatorado
 *
 * Redução: De 128 linhas → ~80 linhas
 * - Herda CRUD genérico do BaseCRUDController
 * - Usa Repository Pattern
 * - Valida com Zod schemas
 * - Logging estruturado
 * - Tratamento de erros centralizado
 *
 * Comparação:
 * ANTES: 60+ try-catch, validações manuais, Prisma direto
 * DEPOIS: Herança, schemas automáticos, repositório injetado
 */
export class QuestionController extends BaseCRUDController<any> {
  repository = new QuestionRepository(prisma);
  createSchema = createQuestionSchema;
  updateSchema = updateQuestionSchema;
  protected resourceName = "Question";

  /**
   * Personalizar como construir filtros WHERE
   */
  protected buildWhere(query: any): any {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * Normalizar resposta (adicionar _id para compatibilidade legacy)
   */
  protected normalizeItem(item: any): any {
    return withLegacyId(item);
  }

  protected normalizeItems(items: any[]): any[] {
    return withLegacyIds(items);
  }

  /**
   * Método customizado: obter questões de uma categoria
   */
  async getByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;

      const questions = await this.repository.findByCategoryId(categoryId);

      logger.info(
        { categoryId, count: questions.length },
        "Retrieved questions by category"
      );

      return res.json({
        success: true,
        data: this.normalizeItems(questions),
      });
    } catch (error) {
      logger.error({ error, categoryId: req.params.categoryId }, "Error retrieving by category");
      throw error;
    }
  }

  /**
   * Override: Preparar dados para criação
   * Atribui createdBy e valida categoria
   */
  protected async prepareCreateData(data: any, userId: string): Promise<any> {
    // Validar categoria existe se fornecida
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new Error(`Category not found: ${data.categoryId}`);
      }
    }

    return {
      ...data,
      createdBy: userId,
      options: data.options || [],
    };
  }

  /**
   * Override: Validar propriedade da questão
   * Apenas criador ou admin pode deletar/atualizar
   */
  protected async validateOwnership(
    item: any,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // Admin pode sempre
    if (userRole === "admin") return true;

    // Criador pode sempre
    if (item.createdBy === userId) return true;

    return false;
  }
}

// ============ EXEMPLO DE USO EM ROTAS ============
/*
import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler.middleware";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();
const controller = new QuestionController();

// Aplicar middleware de autenticação
router.use(authenticateUser);

// CRUD padrão
router.get("/", asyncHandler((req, res) => controller.getAll(req, res)));
router.get("/:id", asyncHandler((req, res) => controller.getById(req, res)));
router.post("/", asyncHandler((req, res) => controller.create(req, res)));
router.put("/:id", asyncHandler((req, res) => controller.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => controller.delete(req, res)));

// Métodos customizados
router.get("/category/:categoryId", asyncHandler((req, res) =>
  controller.getByCategory(req, res)
));

export default router;
*/
