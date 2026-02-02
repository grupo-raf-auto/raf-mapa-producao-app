import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { StatsService } from "../services/stats.service";
import { withLegacyId, withLegacyIds } from "../utils/response.utils";

export class SubmissionController {
  static async getAll(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const templateId = req.query.templateId as string | undefined;
      const where: {
        templateId?: string;
        submittedBy?: string;
        modelContext?: string;
      } = {};

      if (templateId) where.templateId = templateId;
      if (req.user.role !== "admin") where.submittedBy = req.user.id;

      // NEW: Filter by active model context
      if (req.user.activeModelType) {
        where.modelContext = req.user.activeModelType;
      }

      const submissions = await prisma.formSubmission.findMany({
        where,
        orderBy: { submittedAt: "desc" },
      });

      res.json(withLegacyIds(submissions));
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const submission = await prisma.formSubmission.findUnique({
        where: { id },
      });

      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      if (req.user.role !== "admin" && submission.submittedBy !== req.user.id) {
        return res.status(403).json({
          error: "Forbidden: You can only view your own submissions",
        });
      }

      res.json(withLegacyId(submission));
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { templateId, answers } = req.body;

      if (!templateId) {
        return res.status(400).json({ error: "templateId is required" });
      }

      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          error: "At least one answer is required",
        });
      }

      // Verificar se o template existe
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // NEW: Include modelContext and profile FK
      const data: any = {
        templateId,
        answers: answers as unknown as object,
        submittedBy: req.user.id,
        modelContext: req.user.activeModelType,
      };

      // Add profile FK based on model type
      if (req.user.activeModelType === "credito" && req.user.activeModelId) {
        const userModel = await prisma.userModel.findUnique({
          where: { id: req.user.activeModelId },
          include: { creditoProfile: true },
        });
        if (userModel?.creditoProfile) {
          data.creditoProfileId = userModel.creditoProfile.id;
        }
      } else if (
        req.user.activeModelType === "imobiliaria" &&
        req.user.activeModelId
      ) {
        const userModel = await prisma.userModel.findUnique({
          where: { id: req.user.activeModelId },
          include: { imobiliariaProfile: true },
        });
        if (userModel?.imobiliariaProfile) {
          data.imobiliariaProfileId = userModel.imobiliariaProfile.id;
        }
      } else if (req.user.activeModelType === "seguro" && req.user.activeModelId) {
        const userModel = await prisma.userModel.findUnique({
          where: { id: req.user.activeModelId },
          include: { seguroProfile: true },
        });
        if (userModel?.seguroProfile) {
          data.seguroProfileId = userModel.seguroProfile.id;
        }
      }

      const submission = await prisma.formSubmission.create({
        data,
      });

      res.status(201).json({ id: submission.id, success: true });
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ error: "Failed to create submission" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const submission = await prisma.formSubmission.findUnique({
        where: { id },
      });

      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      if (req.user.role !== "admin" && submission.submittedBy !== req.user.id) {
        return res.status(403).json({
          error: "Forbidden: You can only edit your own submissions",
        });
      }

      const answers = req.body.answers ?? submission.answers;
      const updated = await prisma.formSubmission.update({
        where: { id },
        data: { answers: answers as object },
      });

      res.json(withLegacyId(updated));
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ error: "Failed to update submission" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const submission = await prisma.formSubmission.findUnique({
        where: { id },
      });

      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      if (req.user.role !== "admin" && submission.submittedBy !== req.user.id) {
        return res.status(403).json({
          error: "Forbidden: You can only delete your own submissions",
        });
      }

      await prisma.formSubmission.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting submission:", error);
      res.status(500).json({ error: "Failed to delete submission" });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const templateId = req.query.templateId as string | undefined;
      const detailed = req.query.detailed === "true";

      const filters: { templateId?: string; submittedBy?: string } = {};
      if (templateId) filters.templateId = templateId;
      if (req.user.role !== "admin") filters.submittedBy = req.user.id;

      if (detailed) {
        const salesStats = await StatsService.getSalesStats(filters);
        return res.json(salesStats);
      }

      const total = await StatsService.getSubmissionCount(filters);
      res.json({ total });
    } catch (error) {
      console.error("Error fetching submission stats:", error);
      res.status(500).json({ error: "Failed to fetch submission stats" });
    }
  }
}
