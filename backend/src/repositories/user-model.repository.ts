import { BaseRepository } from "./base.repository";
import { PrismaClient } from "@prisma/client";

/**
 * Repository para UserModel com lógica específica
 */
export class UserModelRepository extends BaseRepository<any> {
  constructor(private prisma: PrismaClient) {
    super(prisma.userModel);
  }

  /**
   * Buscar todos os modelos de um usuário
   */
  async findByUserId(userId: string) {
    return await this.prisma.userModel.findMany({
      where: { userId, isActive: true },
      include: {
        creditoProfile: true,
        imobiliariaProfile: true,
        seguroProfile: true,
      },
      orderBy: { activatedAt: "desc" },
    });
  }

  /**
   * Buscar um modelo específico do usuário por tipo
   */
  async findByUserIdAndType(userId: string, modelType: string) {
    return await this.prisma.userModel.findUnique({
      where: {
        userId_modelType: { userId, modelType },
      },
      include: {
        creditoProfile: true,
        imobiliariaProfile: true,
        seguroProfile: true,
      },
    });
  }

  /**
   * Buscar o modelo ativo de um usuário (primeiro ativo)
   */
  async getActiveModel(userId: string, modelType?: string) {
    const where: any = { userId, isActive: true };
    if (modelType) where.modelType = modelType;

    return await this.prisma.userModel.findFirst({
      where,
      include: {
        creditoProfile: true,
        imobiliariaProfile: true,
        seguroProfile: true,
      },
    });
  }

  /**
   * Contar modelos ativos de um usuário
   */
  async countActiveModels(userId: string): Promise<number> {
    return await this.prisma.userModel.count({
      where: { userId, isActive: true },
    });
  }

  /**
   * Buscar usuário com todos seus modelos
   */
  async findUserWithModels(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userModels: {
          where: { isActive: true },
          include: {
            creditoProfile: true,
            imobiliariaProfile: true,
            seguroProfile: true,
          },
        },
      },
    });
  }

  /**
   * Criar novo modelo para usuário
   */
  async createUserModel(
    userId: string,
    modelType: string,
    profileId?: string,
    activatedBy?: string
  ) {
    const data: any = {
      userId,
      modelType,
      isActive: true, // Garantir que novos modelos adicionados ficam ativos
      activatedBy,
    };

    // Definir FK para o perfil correto baseado no tipo
    if (modelType === "credito" && profileId) {
      data.creditoProfileId = profileId;
    } else if (modelType === "imobiliaria" && profileId) {
      data.imobiliariaProfileId = profileId;
    } else if (modelType === "seguro" && profileId) {
      data.seguroProfileId = profileId;
    }

    return await this.prisma.userModel.create({
      data,
      include: {
        creditoProfile: true,
        imobiliariaProfile: true,
        seguroProfile: true,
      },
    });
  }

  /**
   * Toggle status do modelo (ativar/desativar)
   */
  async toggleStatus(modelId: string): Promise<any> {
    const userModel = await this.prisma.userModel.findUnique({
      where: { id: modelId },
    });

    if (!userModel) {
      throw new Error(`UserModel ${modelId} not found`);
    }

    return await this.prisma.userModel.update({
      where: { id: modelId },
      data: { isActive: !userModel.isActive },
      include: {
        creditoProfile: true,
        imobiliariaProfile: true,
        seguroProfile: true,
      },
    });
  }
}
