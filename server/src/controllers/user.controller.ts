import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class UserController {
  static async getAll(_req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
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
      res.json(users.map((u) => ({ ...u, _id: u.id, clerkId: u.id })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
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
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ ...user, _id: user.id, clerkId: user.id });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ ...user, _id: user.id, clerkId: user.id });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch current user" });
    }
  }

  static async create(req: Request, res: Response) {
    // Utilizadores são criados via Better Auth (sign-up). Este endpoint fica desativado.
    res.status(400).json({
      error:
        "Criação de utilizadores via API não é suportada. Use o registo em /sign-up.",
    });
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role, isActive, firstName, lastName } = req.body;

      if (role && req.user?.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Only admins can change user roles" });
      }

      const data: Record<string, unknown> = {};
      if (role) data.role = role;
      if (typeof isActive === "boolean") data.isActive = isActive;
      if (firstName !== undefined) data.firstName = firstName;
      if (lastName !== undefined) data.lastName = lastName;

      await prisma.user.update({
        where: { id },
        data: data as Parameters<typeof prisma.user.update>[0]["data"],
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });
      if (user && user.id === req.user?.id) {
        return res
          .status(400)
          .json({ error: "Cannot delete your own account" });
      }
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can view stats" });
      }

      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });
      const allSubmissions = await prisma.formSubmission.findMany();
      const allTemplates = await prisma.template.findMany();
      const allQuestions = await prisma.question.findMany();

      const userStats = users.map((user) => {
        const uid = user.id;
        const userSubmissions = allSubmissions.filter(
          (s) => s.submittedBy === uid,
        );
        const userTemplates = allTemplates.filter((t) => t.createdBy === uid);
        const userQuestions = allQuestions.filter((q) => q.createdBy === uid);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSubmissions = userSubmissions.filter(
          (s) => new Date(s.submittedAt) >= thirtyDaysAgo,
        );
        const activeDays = new Set(
          recentSubmissions.map(
            (s) => new Date(s.submittedAt).toISOString().split("T")[0],
          ),
        ).size;

        const submissionsByDay: Record<string, number> = {};
        recentSubmissions.forEach((s) => {
          const d = new Date(s.submittedAt).toISOString().split("T")[0];
          submissionsByDay[d] = (submissionsByDay[d] || 0) + 1;
        });

        const templateDistribution: Record<string, number> = {};
        userSubmissions.forEach((s) => {
          templateDistribution[s.templateId] =
            (templateDistribution[s.templateId] || 0) + 1;
        });

        return {
          userId: user.id,
          clerkId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          totalSubmissions: userSubmissions.length,
          totalTemplates: userTemplates.length,
          totalQuestions: userQuestions.length,
          activeDaysLast30: activeDays,
          submissionsByDay,
          templateDistribution,
          createdAt: user.createdAt,
        };
      });

      const rankedUsers = userStats.sort(
        (a, b) => b.totalSubmissions - a.totalSubmissions,
      );
      res.json({
        users: rankedUsers,
        stats: {
          totalUsers: users.length,
          totalSubmissions: allSubmissions.length,
          totalTemplates: allTemplates.length,
          totalQuestions: allQuestions.length,
          activeUsersLast30: userStats.filter((u) => u.activeDaysLast30 > 0)
            .length,
        },
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  }
}
