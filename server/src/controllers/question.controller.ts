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
   * Questions are shared resources used in templates/forms.
   * Allow access to all authenticated users, but only admin or creator can delete.
   * For get/update operations, allow access if:
   * - User is admin
   * - Question has no creator (public/shared question)
   * - User is the creator
   */
  protected async validateOwnership(
    item: any,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    if (userRole === "admin") return true;
    
    // If question has no creator, it's a public/shared resource
    if (!item.createdBy) return true;
    
    // Otherwise, only creator can access
    return item.createdBy === userId;
  }
}
