import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { withLegacyId, withLegacyIds, successResponse } from "../utils/response.utils";

export class TemplateController {
  static async getAll(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const templates = await prisma.template.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          questions: {
            include: { question: true },
            orderBy: { order: "asc" },
          },
        },
      });

      const filtered =
        req.user.role === "admin"
          ? templates
          : templates.filter(
              (t) => t.isPublic || t.isDefault || t.createdBy === req.user?.id
            );

      // Mapear para formato compatível (manter questionIds para retrocompatibilidade)
      const mapped = filtered.map((t) => ({
        ...t,
        questions: t.questions.map((tq) => tq.questionId),
        _questions: t.questions.map((tq) => tq.question),
      }));

      res.json(successResponse(withLegacyIds(mapped)));
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await prisma.template.findUnique({
        where: { id },
        include: {
          questions: {
            include: { question: true },
            orderBy: { order: "asc" },
          },
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Mapear para formato compatível
      const mapped = {
        ...template,
        questions: template.questions.map((tq) => tq.questionId),
        _questions: template.questions.map((tq) => tq.question),
      };

      res.json(successResponse(withLegacyId(mapped)));
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { title, description, questions, isPublic, modelType } = req.body;
      const questionIds: string[] = questions || [];

      // Validar modelType se fornecido
      if (modelType && !["credito", "imobiliaria", "seguro"].includes(modelType)) {
        return res.status(400).json({ error: "Invalid modelType. Must be: credito, imobiliaria, or seguro" });
      }

      // Criar template com relações de questões
      const template = await prisma.template.create({
        data: {
          title,
          description,
          isPublic: isPublic || false,
          modelType,
          createdBy: req.user.id,
          // Manter campo legado para compatibilidade
          questionIds,
          // Criar relações na tabela de junção
          questions: {
            create: questionIds.map((questionId: string, index: number) => ({
              questionId,
              order: index,
            })),
          },
        },
      });

      res.status(201).json({ id: template.id });
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, questions, isPublic, modelType } = req.body;

      // Verificar se template existe
      const existing = await prisma.template.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Validar modelType se fornecido
      if (modelType && !["credito", "imobiliaria", "seguro"].includes(modelType)) {
        return res.status(400).json({ error: "Invalid modelType. Must be: credito, imobiliaria, or seguro" });
      }

      // Atualizar usando transação para garantir consistência
      await prisma.$transaction(async (tx) => {
        // Atualizar campos básicos do template
        const data: Record<string, unknown> = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (isPublic !== undefined) data.isPublic = isPublic;
        if (modelType !== undefined) data.modelType = modelType;

        // Se questions foi enviado, atualizar relações
        if (questions !== undefined) {
          const questionIds: string[] = questions;
          data.questionIds = questionIds;

          // Deletar relações antigas
          await tx.templateQuestion.deleteMany({
            where: { templateId: id },
          });

          // Criar novas relações
          if (questionIds.length > 0) {
            await tx.templateQuestion.createMany({
              data: questionIds.map((questionId: string, index: number) => ({
                templateId: id,
                questionId,
                order: index,
              })),
            });
          }
        }

        await tx.template.update({
          where: { id },
          data,
        });
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { id } = req.params;
      const template = await prisma.template.findUnique({ where: { id } });
      if (!template)
        return res.status(404).json({ error: "Template not found" });
      if (template.isDefault) {
        return res.status(400).json({
          error: "Não é possível excluir templates padrão do sistema",
        });
      }
      if (req.user.role !== "admin" && template.createdBy !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Forbidden: You can only delete your own templates" });
      }
      await prisma.template.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  }
}
