import { BaseRepository } from "./base.repository";
import { PrismaClient } from "@prisma/client";

/**
 * Repository específico para Question
 * Herda todos os métodos base e pode adicionar lógica customizada
 */
export class QuestionRepository extends BaseRepository<any> {
  constructor(private prisma: PrismaClient) {
    super(prisma.question);
  }

  /**
   * Buscar questões com filtros específicos (status, categoria, busca)
   */
  async findWithFilters(filters: {
    status?: string;
    categoryId?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { status, categoryId, search, skip = 0, take = 20 } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    return await this.prisma.question.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { category: true },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Contar questões com filtros
   */
  async countWithFilters(filters: {
    status?: string;
    categoryId?: string;
    search?: string;
  }) {
    const { status, categoryId, search } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    return await this.prisma.question.count(
      Object.keys(where).length ? { where } : undefined
    );
  }

  /**
   * Buscar por categoria com validação
   */
  async findByCategoryId(categoryId: string) {
    // Validar que categoria existe
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    return await this.prisma.question.findMany({
      where: { categoryId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Deletar questão (soft delete se necessário)
   * Override para lógica customizada
   */
  async delete(id: string) {
    // Validar se há templates usando esta questão
    const templatesUsing = await this.prisma.templateQuestion.count({
      where: { questionId: id },
    });

    if (templatesUsing > 0) {
      throw new Error(
        `Cannot delete question: used in ${templatesUsing} template(s)`
      );
    }

    return await super.delete(id);
  }
}
