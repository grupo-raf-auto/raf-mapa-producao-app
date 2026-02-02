import { Request, Response } from "express";
import { UserModelRepository } from "../repositories/user-model.repository";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";
import { VALID_MODEL_TYPES } from "../constants";

export class UserModelController {
  private repository = new UserModelRepository(prisma);

  /**
   * GET /api/user-models/my-models
   * Get all models for the authenticated user
   */
  async getMyModels(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized: User not authenticated",
        });
      }

      const models = await this.repository.findByUserId(user.id);

      logger.info({ userId: user.id, modelCount: models.length }, "Retrieved user models");

      return res.json({
        success: true,
        data: models,
      });
    } catch (error) {
      logger.error({ error }, "Error fetching user models");
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * POST /api/user-models/switch-model/:modelId
   * Switch active model context for current user
   */
  async switchModel(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { modelId } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized: User not authenticated",
        });
      }

      const userModel = await this.repository.findUnique(modelId);

      if (!userModel || userModel.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Cannot switch to this model",
        });
      }

      if (!userModel.isActive) {
        return res.status(400).json({
          success: false,
          error: "Bad request: This model is inactive",
        });
      }

      logger.info(
        { userId: user.id, modelId, modelType: userModel.modelType },
        "User switched model context"
      );

      return res.json({
        success: true,
        data: {
          activeModel: userModel,
          message: "Model context switched successfully",
        },
      });
    } catch (error) {
      logger.error({ error }, "Error switching model");
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * POST /api/user-models/my-models
   * Add a new model to the authenticated user (non-admin endpoint)
   */
  async addModelToMyUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { modelType } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized: User not authenticated",
        });
      }

      // Validate modelType
      const validTypes = ["credito", "imobiliaria", "seguro"];
      if (!validTypes.includes(modelType)) {
        return res.status(400).json({
          success: false,
          error: `Bad request: Invalid model type. Must be one of: ${validTypes.join(", ")}`,
        });
      }

      // Check if user already has this model
      const existing = await this.repository.findByUserIdAndType(user.id, modelType);
      if (existing) {
        // If model exists but is inactive, reactivate it instead of rejecting
        if (!existing.isActive) {
          const reactivated = await this.repository.toggleStatus(existing.id);
          logger.info(
            { userId: user.id, modelType },
            "User reactivated their own model"
          );
          return res.json({
            success: true,
            data: reactivated,
            message: "Model reactivated successfully",
          });
        }
        // Model is already active
        return res.status(400).json({
          success: false,
          error: "Bad request: User already has this model active",
        });
      }

      // Create profile based on type
      let profileId: string;
      switch (modelType) {
        case "credito": {
          const creditoProfile = await prisma.creditoProfile.create({ data: {} });
          profileId = creditoProfile.id;
          break;
        }
        case "imobiliaria": {
          const imobiliariaProfile = await prisma.imobiliariaProfile.create({
            data: {},
          });
          profileId = imobiliariaProfile.id;
          break;
        }
        case "seguro": {
          const seguroProfile = await prisma.seguroProfile.create({ data: {} });
          profileId = seguroProfile.id;
          break;
        }
        default:
          return res.status(400).json({
            success: false,
            error: "Invalid model type",
          });
      }

      const userModel = await this.repository.createUserModel(
        user.id,
        modelType,
        profileId,
        user.id // User adds to themselves
      );

      logger.info(
        { userId: user.id, modelType },
        "User added model to themselves"
      );

      return res.status(201).json({
        success: true,
        data: userModel,
      });
    } catch (error) {
      logger.error({ error }, "Error adding model to user");
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * GET /api/user-models/user/:userId/models (Admin only)
   * Get all models for a specific user
   */
  async getUserModels(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { userId } = req.params;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Only admins can view other users' models",
        });
      }

      const models = await this.repository.findByUserId(userId);

      logger.info(
        { adminId: user.id, userId, modelCount: models.length },
        "Admin retrieved user models"
      );

      return res.json({
        success: true,
        data: models,
      });
    } catch (error) {
      logger.error({ error }, "Error fetching user models");
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * POST /api/user-models/user/:userId/models (Admin only)
   * Add a new model to a user
   */
  async addModelToUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { userId } = req.params;
      const { modelType } = req.body;
      const adminUser = user;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Only admins can add models to users",
        });
      }

      // Validate modelType
      const validTypes = ["credito", "imobiliaria", "seguro"];
      if (!validTypes.includes(modelType)) {
        return res.status(400).json({
          success: false,
          error: `Bad request: Invalid model type. Must be one of: ${validTypes.join(", ")}`,
        });
      }

      // Check if user already has this model
      const existing = await this.repository.findByUserIdAndType(userId, modelType);
      if (existing) {
        // If model exists but is inactive, reactivate it instead of rejecting
        if (!existing.isActive) {
          const reactivated = await this.repository.toggleStatus(existing.id);
          logger.info(
            { userId, modelType, adminId: adminUser.id },
            "Admin reactivated user model"
          );
          return res.json({
            success: true,
            data: reactivated,
            message: "Model reactivated successfully",
          });
        }
        // Model is already active
        return res.status(400).json({
          success: false,
          error: "Bad request: User already has this model active",
        });
      }

      // Create profile based on type
      let profileId: string;
      switch (modelType) {
        case "credito": {
          const creditoProfile = await prisma.creditoProfile.create({ data: {} });
          profileId = creditoProfile.id;
          break;
        }
        case "imobiliaria": {
          const imobiliariaProfile = await prisma.imobiliariaProfile.create({
            data: {},
          });
          profileId = imobiliariaProfile.id;
          break;
        }
        case "seguro": {
          const seguroProfile = await prisma.seguroProfile.create({ data: {} });
          profileId = seguroProfile.id;
          break;
        }
        default:
          return res.status(400).json({
            success: false,
            error: "Invalid model type",
          });
      }

      const userModel = await this.repository.createUserModel(
        userId,
        modelType,
        profileId,
        adminUser.id
      );

      logger.info(
        { userId, modelType, adminId: adminUser.id },
        "Model added to user"
      );

      return res.status(201).json({
        success: true,
        data: userModel,
      });
    } catch (error) {
      logger.error({ error }, "Error adding model to user");
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * DELETE /api/user-models/user/:userId/models/:modelId (Admin only)
   * Remove a model from a user
   */
  async removeModelFromUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { userId, modelId } = req.params;
      const adminUser = user;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Only admins can remove models from users",
        });
      }

      const userModel = await this.repository.findUnique(modelId);

      if (!userModel || userModel.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Not found: UserModel not found",
        });
      }

      // Prevent removing the last model if user only has one
      const modelCount = await this.repository.countActiveModels(userId);
      if (modelCount <= 1) {
        return res.status(400).json({
          success: false,
          error: "Bad request: User must have at least one active model",
        });
      }

      await this.repository.delete(modelId);

      logger.info(
        { userId, modelId, adminId: adminUser.id },
        "Model removed from user"
      );

      return res.json({
        success: true,
        data: null,
      });
    } catch (error) {
      logger.error({ error }, "Error removing model from user");
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * PATCH /api/user-models/user/:userId/models/:modelId/toggle (Admin only)
   * Toggle active/inactive status of a user model
   */
  async toggleModelStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { userId, modelId } = req.params;
      const adminUser = user;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Only admins can toggle model status",
        });
      }

      const userModel = await this.repository.findUnique(modelId);

      if (!userModel || userModel.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Not found: UserModel not found",
        });
      }

      // Prevent deactivating the last active model if user only has one
      if (userModel.isActive) {
        const activeModelCount = await this.repository.countActiveModels(userId);
        if (activeModelCount <= 1) {
          return res.status(400).json({
            success: false,
            error: "Bad request: User must have at least one active model",
          });
        }
      }

      const updatedModel = await this.repository.toggleStatus(modelId);

      logger.info(
        {
          userId,
          modelId,
          newStatus: updatedModel.isActive,
          adminId: adminUser.id,
        },
        "Model status toggled"
      );

      return res.json({
        success: true,
        data: updatedModel,
      });
    } catch (error) {
      logger.error({ error }, "Error toggling model status");
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
