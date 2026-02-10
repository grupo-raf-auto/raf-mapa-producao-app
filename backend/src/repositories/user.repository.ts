import { BaseRepository } from "./base.repository";
import { PrismaClient } from "@prisma/client";

/**
 * Repository para User com lógica específica
 */
export class UserRepository extends BaseRepository<any> {
  constructor(private prisma: PrismaClient) {
    super(prisma.user);
  }

  /**
   * Buscar usuário com seleção de campos específicos
   * Evitar retornar senhas/dados sensíveis
   */
  async findByIdSafe(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Listar usuários com paginação
   */
  async findAllSafe(skip: number = 0, take: number = 20) {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Atualizar apenas campos permitidos
   */
  async updateSafe(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: string;
      isActive?: boolean;
    }
  ) {
    return await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
