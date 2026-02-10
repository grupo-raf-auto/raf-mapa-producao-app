import { Request, Response } from 'express';
import { BaseCRUDController } from './base-crud.controller';
import { QuestionRepository } from '../repositories/question.repository';
import { createQuestionSchema, updateQuestionSchema } from '../schemas/index';
import { prisma } from '../lib/prisma';
import { withLegacyId, withLegacyIds } from '../utils/response.utils';

/**
 * QuestionController
 *
 * Refatorado para usar BaseCRUDController.
 * Apenas administradores podem criar/editar questões; utilizadores apenas preenchem formulários.
 */
export class QuestionController extends BaseCRUDController<any> {
  repository = new QuestionRepository(prisma);
  createSchema = createQuestionSchema;
  updateSchema = updateQuestionSchema;
  protected resourceName = 'Question';

  /**
   * Apenas administradores podem criar questões.
   */
  async create(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Apenas administradores podem criar questões.',
      });
    }
    return super.create(req, res);
  }

  /**
   * Customizar busca com filtros específicos
   */
  protected buildWhere(query: any): any {
    const where: any = {};

    if (query.status && typeof query.status === 'string') {
      where.status = query.status;
    }

    if (query.categoryId && typeof query.categoryId === 'string') {
      where.categoryId = query.categoryId;
    }

    if (query.search && typeof query.search === 'string') {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Garantir dados válidos para criação: options como array e status com default.
   * Evita que Prisma falhe ou persista dados incompletos.
   * NÃO usar super.prepareCreateData porque adiciona userId que não existe no modelo Question.
   */
  protected prepareCreateData(data: any, userId: string): any {
    return {
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'active',
      inputType: data.inputType ?? null,
      options: Array.isArray(data.options) ? data.options : [],
      categoryId: data.categoryId ?? null,
      createdBy: userId,
    };
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
   * All authenticated users can READ questions (needed to fill forms).
   * Only admin or creator can UPDATE/DELETE - this is enforced in the update/delete methods.
   */
  protected async validateOwnership(
    _item: any,
    _userId: string,
    _userRole: string,
  ): Promise<boolean> {
    // Questions are shared resources - allow read access to all authenticated users
    // Write restrictions are handled in update() method
    return true;
  }

  /**
   * Apenas administradores podem atualizar questões.
   */
  async update(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Apenas administradores podem editar questões.',
      });
    }
    return super.update(req, res);
  }

  /**
   * Apenas administradores podem eliminar questões.
   */
  async delete(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Apenas administradores podem eliminar questões.',
      });
    }
    return super.delete(req, res);
  }
}
