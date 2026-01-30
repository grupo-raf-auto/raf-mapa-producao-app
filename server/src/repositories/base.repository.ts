import { IRepository, RepositoryFilters } from "../types/index";
import logger from "../lib/logger";

// Type para modelo Prisma genérico
interface PrismaModel {
  findMany(args?: Record<string, unknown>): Promise<unknown[]>;
  findUnique(args: Record<string, unknown>): Promise<unknown | null>;
  findUniqueBy(args: Record<string, unknown>): Promise<unknown | null>;
  create(args: Record<string, unknown>): Promise<unknown>;
  update(args: Record<string, unknown>): Promise<unknown>;
  delete(args: Record<string, unknown>): Promise<unknown>;
  deleteMany(args?: Record<string, unknown>): Promise<unknown>;
  count(args?: Record<string, unknown>): Promise<number>;
}

/**
 * Classe base para todos os repositories
 * Oferece CRUD genérico para qualquer modelo Prisma
 *
 * Uso:
 * class UserRepository extends BaseRepository<User> {
 *   constructor(private prisma: PrismaClient) {
 *     super(prisma.user);
 *   }
 * }
 */
export abstract class BaseRepository<T> implements IRepository<T, Record<string, unknown>, Record<string, unknown>> {
  protected modelName: string;

  constructor(protected model: PrismaModel) {
    this.modelName = (model as { constructor: { name: string } }).constructor.name || "Entity";
  }

  /**
   * Buscar múltiplos registros com filtros opcionais
   */
  async findMany(filters: RepositoryFilters = {}): Promise<T[]> {
    try {
      logger.debug({ filters, model: this.modelName }, "Finding multiple");
      return (await this.model.findMany(filters as Record<string, unknown>)) as T[];
    } catch (error) {
      logger.error(
        { error, model: this.modelName },
        "Error finding multiple"
      );
      throw error;
    }
  }

  /**
   * Buscar um registro único por ID
   */
  async findUnique(id: string): Promise<T | null> {
    try {
      logger.debug({ id, model: this.modelName }, "Finding unique");
      return (await this.model.findUnique({ where: { id } })) as T | null;
    } catch (error) {
      logger.error({ error, id, model: this.modelName }, "Error finding unique");
      throw error;
    }
  }

  /**
   * Buscar um registro com condição customizada
   */
  async findUniqueBy(where: any): Promise<T | null> {
    try {
      logger.debug({ where, model: this.modelName }, "Finding by condition");
      return (await this.model.findUnique({ where })) as T | null;
    } catch (error) {
      logger.error(
        { error, where, model: this.modelName },
        "Error finding by condition"
      );
      throw error;
    }
  }

  /**
   * Criar novo registro
   */
  async create(data: any): Promise<T> {
    try {
      logger.debug({ data, model: this.modelName }, "Creating");
      return (await this.model.create({ data })) as T;
    } catch (error) {
      logger.error({ error, model: this.modelName }, "Error creating");
      throw error;
    }
  }

  /**
   * Atualizar registro
   */
  async update(id: string, data: any): Promise<T> {
    try {
      logger.debug({ id, data, model: this.modelName }, "Updating");
      return (await this.model.update({
        where: { id },
        data,
      })) as T;
    } catch (error) {
      logger.error(
        { error, id, model: this.modelName },
        "Error updating"
      );
      throw error;
    }
  }

  /**
   * Deletar registro
   */
  async delete(id: string): Promise<T> {
    try {
      logger.debug({ id, model: this.modelName }, "Deleting");
      return (await this.model.delete({ where: { id } })) as T;
    } catch (error) {
      logger.error({ error, id, model: this.modelName }, "Error deleting");
      throw error;
    }
  }

  /**
   * Contar registros com filtros opcionais
   */
  async count(filters: any = {}): Promise<number> {
    try {
      logger.debug({ filters, model: this.modelName }, "Counting");
      return await this.model.count(filters);
    } catch (error) {
      logger.error(
        { error, model: this.modelName },
        "Error counting"
      );
      throw error;
    }
  }

  /**
   * Deletar múltiplos registros (use com cuidado!)
   */
  async deleteMany(where: any): Promise<number> {
    try {
      logger.warn({ where, model: this.modelName }, "Deleting multiple");
      const result = (await this.model.deleteMany({ where })) as { count: number };
      return result.count;
    } catch (error) {
      logger.error(
        { error, where, model: this.modelName },
        "Error deleting multiple"
      );
      throw error;
    }
  }

  /**
   * Executar transação customizada
   */
  async transaction<R>(callback: (model: any) => Promise<R>): Promise<R> {
    // Implementar conforme necessário com prisma.$transaction
    return callback(this.model);
  }
}
