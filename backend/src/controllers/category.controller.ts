import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { withLegacyId, withLegacyIds } from "../utils/response.utils";

export class CategoryController {
  static async getAll(_req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { questions: true } },
        },
      });

      res.json(withLegacyIds(categories));
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          questions: true,
          _count: { select: { questions: true } },
        },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(withLegacyId(category));
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, description, color } = req.body;
      const category = await prisma.category.create({
        data: { name, description, color },
      });
      res.status(201).json({ id: category.id });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;
      await prisma.category.update({
        where: { id },
        data: { name, description, color },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.category.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
}
