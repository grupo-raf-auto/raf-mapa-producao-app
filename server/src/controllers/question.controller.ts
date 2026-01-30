import { Request, Response } from "express";
import { BaseCRUDController } from "./base-crud.controller";
import { QuestionRepository } from "../repositories/question.repository";
import { createQuestionSchema, updateQuestionSchema } from "../schemas/index";
import { prisma } from "../lib/prisma";
import { withLegacyId, withLegacyIds } from "../utils/response.utils";

/**
 * QuestionController
 *
 * Refatorado para usar BaseCRUDController
 * - Elimina duplicação de CRUD
 * - Usa validação Zod centralizada
 * - Mantém lógica específica de busca
 * - Logging estruturado incluído na base
 */
export class QuestionController extends BaseCRUDController<any> {
  repository = new QuestionRepository(prisma);
  createSchema = createQuestionSchema;
  updateSchema = updateQuestionSchema;
  protected resourceName = "Question";

  /**
   * Customizar busca com filtros específicos
   */
  protected buildWhere(query: any): any {
    const where: any = {};

    if (query.status && typeof query.status === "string") {
      where.status = query.status;
    }

    if (query.categoryId && typeof query.categoryId === "string") {
      where.categoryId = query.categoryId;
    }

    if (query.search && typeof query.search === "string") {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * Normalizar resposta (adicionar _id legado)
   */
  protected normalizeItem(item: any): any {
    return withLegacyId(item);
  }

  protected normalizeItems(items: any[]): any {
    return withLegacyIds(items);
  }

  /**
   * Permitir apenas admin ou criador deletar
   */
  protected async validateOwnership(
    item: any,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    if (userRole === "admin") return true;
    return item.createdBy === userId;
  }
}
