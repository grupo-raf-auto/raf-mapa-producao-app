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
      const allDocuments = await prisma.document.findMany({
        where: { isActive: true },
        include: { chunks: true },
      });
      const allChatMessages = await prisma.chatMessage.findMany();

      // Calcular períodos
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Estatísticas globais de documentos
      const totalDocuments = allDocuments.length;
      const processedDocuments = allDocuments.filter((d) => d.processedAt).length;
      const totalChunks = allDocuments.reduce(
        (sum, d) => sum + d.chunks.length,
        0,
      );
      const documentsLast30 = allDocuments.filter(
        (d) => new Date(d.uploadedAt) >= thirtyDaysAgo,
      ).length;
      const documentsLast7 = allDocuments.filter(
        (d) => new Date(d.uploadedAt) >= sevenDaysAgo,
      ).length;

      // Estatísticas globais de chat
      const totalChatMessages = allChatMessages.length;
      const userMessages = allChatMessages.filter((m) => m.role === "user");
      const assistantMessages = allChatMessages.filter(
        (m) => m.role === "assistant",
      );
      const uniqueConversations = new Set(
        allChatMessages.map((m) => m.conversationId),
      ).size;
      const chatMessagesLast30 = allChatMessages.filter(
        (m) => new Date(m.createdAt) >= thirtyDaysAgo,
      ).length;
      const chatMessagesLast7 = allChatMessages.filter(
        (m) => new Date(m.createdAt) >= sevenDaysAgo,
      ).length;

      // Estatísticas de submissões por período
      const totalSubmissions = allSubmissions.length;
      const submissionsLast30 = allSubmissions.filter(
        (s) => new Date(s.submittedAt) >= thirtyDaysAgo,
      ).length;
      const submissionsLast7 = allSubmissions.filter(
        (s) => new Date(s.submittedAt) >= sevenDaysAgo,
      ).length;
      const submissionsToday = allSubmissions.filter(
        (s) => new Date(s.submittedAt) >= today,
      ).length;

      // Distribuição de submissões por dia (últimos 30 dias)
      const submissionsByDay: Record<string, number> = {};
      const documentsByDay: Record<string, number> = {};
      const chatMessagesByDay: Record<string, number> = {};

      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toISOString().split("T")[0];
        submissionsByDay[dateStr] = 0;
        documentsByDay[dateStr] = 0;
        chatMessagesByDay[dateStr] = 0;
      }

      allSubmissions.forEach((s) => {
        const d = new Date(s.submittedAt).toISOString().split("T")[0];
        if (submissionsByDay[d] !== undefined) {
          submissionsByDay[d] = (submissionsByDay[d] || 0) + 1;
        }
      });

      allDocuments.forEach((d) => {
        const dateStr = new Date(d.uploadedAt).toISOString().split("T")[0];
        if (documentsByDay[dateStr] !== undefined) {
          documentsByDay[dateStr] = (documentsByDay[dateStr] || 0) + 1;
        }
      });

      allChatMessages.forEach((m) => {
        const dateStr = new Date(m.createdAt).toISOString().split("T")[0];
        if (chatMessagesByDay[dateStr] !== undefined) {
          chatMessagesByDay[dateStr] = (chatMessagesByDay[dateStr] || 0) + 1;
        }
      });

      const userStats = users.map((user) => {
        const uid = user.id;
        const userSubmissions = allSubmissions.filter(
          (s) => s.submittedBy === uid,
        );
        const userTemplates = allTemplates.filter((t) => t.createdBy === uid);
        const userQuestions = allQuestions.filter((q) => q.createdBy === uid);
        const userDocuments = allDocuments.filter((d) => d.uploadedBy === uid);
        const userChatMessages = allChatMessages.filter((m) => m.userId === uid);
        const userUserMessages = userChatMessages.filter((m) => m.role === "user");
        const userConversations = new Set(
          userChatMessages.map((m) => m.conversationId),
        ).size;

        const recentSubmissions = userSubmissions.filter(
          (s) => new Date(s.submittedAt) >= thirtyDaysAgo,
        );
        const recentDocuments = userDocuments.filter(
          (d) => new Date(d.uploadedAt) >= thirtyDaysAgo,
        );
        const recentChatMessages = userChatMessages.filter(
          (m) => new Date(m.createdAt) >= thirtyDaysAgo,
        );

        const activeDays = new Set(
          [
            ...recentSubmissions.map((s) =>
              new Date(s.submittedAt).toISOString().split("T")[0],
            ),
            ...recentDocuments.map((d) =>
              new Date(d.uploadedAt).toISOString().split("T")[0],
            ),
            ...recentChatMessages.map((m) =>
              new Date(m.createdAt).toISOString().split("T")[0],
            ),
          ],
        ).size;

        const submissionsByDayUser: Record<string, number> = {};
        recentSubmissions.forEach((s) => {
          const d = new Date(s.submittedAt).toISOString().split("T")[0];
          submissionsByDayUser[d] = (submissionsByDayUser[d] || 0) + 1;
        });

        const templateDistribution: Record<string, number> = {};
        userSubmissions.forEach((s) => {
          templateDistribution[s.templateId] =
            (templateDistribution[s.templateId] || 0) + 1;
        });

        const processedDocs = userDocuments.filter((d) => d.processedAt).length;
        const totalUserChunks = userDocuments.reduce(
          (sum, d) => sum + d.chunks.length,
          0,
        );

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
          totalDocuments: userDocuments.length,
          processedDocuments: processedDocs,
          totalChunks: totalUserChunks,
          totalChatMessages: userChatMessages.length,
          totalUserMessages: userUserMessages.length,
          totalConversations: userConversations,
          activeDaysLast30: activeDays,
          submissionsByDay: submissionsByDayUser,
          templateDistribution,
          createdAt: user.createdAt,
        };
      });

      const rankedUsers = userStats.sort(
        (a, b) => b.totalSubmissions - a.totalSubmissions,
      );

      // Calcular médias
      const avgSubmissionsPerUser =
        users.length > 0 ? allSubmissions.length / users.length : 0;
      const avgDocumentsPerUser =
        users.length > 0 ? totalDocuments / users.length : 0;
      const avgChatMessagesPerUser =
        users.length > 0 ? totalChatMessages / users.length : 0;
      const avgActiveDays =
        userStats.length > 0
          ? userStats.reduce((sum, u) => sum + u.activeDaysLast30, 0) /
            userStats.length
          : 0;

      res.json({
        users: rankedUsers,
        stats: {
          totalUsers: users.length,
          activeUsersLast30: userStats.filter((u) => u.activeDaysLast30 > 0)
            .length,
          inactiveUsers: users.length - userStats.filter((u) => u.activeDaysLast30 > 0).length,
          totalSubmissions,
          submissionsLast30,
          submissionsLast7,
          submissionsToday,
          avgSubmissionsPerUser: Math.round(avgSubmissionsPerUser * 10) / 10,
          totalTemplates: allTemplates.length,
          totalQuestions: allQuestions.length,
          totalDocuments,
          processedDocuments,
          documentsLast30,
          documentsLast7,
          totalChunks,
          avgDocumentsPerUser: Math.round(avgDocumentsPerUser * 10) / 10,
          totalChatMessages,
          userMessages: userMessages.length,
          assistantMessages: assistantMessages.length,
          uniqueConversations,
          chatMessagesLast30,
          chatMessagesLast7,
          avgChatMessagesPerUser: Math.round(avgChatMessagesPerUser * 10) / 10,
          avgActiveDays: Math.round(avgActiveDays * 10) / 10,
        },
        trends: {
          submissionsByDay,
          documentsByDay,
          chatMessagesByDay,
        },
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  }
}
