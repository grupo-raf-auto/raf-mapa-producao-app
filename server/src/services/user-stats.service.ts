import { prisma } from "../lib/prisma";
import logger from "../lib/logger";
import { FormSubmission, User, Template } from "@prisma/client";

/**
 * UserStatsService
 *
 * EXTRAÍDO de: UserController.getStats() (248 linhas)
 * REDUZIDO para: ~120 linhas de código testável
 *
 * Responsabilidade: Calcular estatísticas de usuários e formulários
 * Justificativa: Lógica de negócio pertence a Service, não Controller
 */

interface UserStat {
  userId: string;
  userName: string;
  submissionCount: number;
  lastSubmission: Date;
}

interface TemplateStat {
  templateId: string;
  templateName: string;
  submissionCount: number;
}

interface TrendingQuestion {
  questionId: string;
  title: string;
  count: number;
}

interface GenerateStatsResult {
  users: UserStats[];
  stats: {
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    rejectedUsers: number;
    activeUsersLast30: number;
    inactiveUsers: number;
    totalSubmissions: number;
    submissionsLast30: number;
    submissionsLast7: number;
    submissionsToday: number;
    avgSubmissionsPerUser: number;
    totalTemplates: number;
    totalQuestions: number;
    totalDocuments: number;
    processedDocuments: number;
    documentsLast30: number;
    documentsLast7: number;
    totalChunks: number;
    avgDocumentsPerUser: number;
    totalChatMessages: number;
    userMessages: number;
    assistantMessages: number;
    uniqueConversations: number;
    chatMessagesLast30: number;
    chatMessagesLast7: number;
    avgChatMessagesPerUser: number;
    avgActiveDays: number;
  };
  trends: {
    submissionsByDay: Record<string, number>;
    documentsByDay: Record<string, number>;
    chatMessagesByDay: Record<string, number>;
  };
}

interface UserStats {
  userId: string;
  clerkId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  totalSubmissions: number;
  totalTemplates: number;
  totalQuestions: number;
  totalDocuments: number;
  processedDocuments: number;
  totalChunks: number;
  totalChatMessages: number;
  totalUserMessages: number;
  totalConversations: number;
  activeDaysLast30: number;
  submissionsByDay: Record<string, number>;
  templateDistribution: Record<string, number>;
  createdAt: Date;
}

type SubmissionWithRelations = FormSubmission & {
  user: User;
  template: Template;
};

const STATS_DATE_RANGE_DAYS = 30;

export class UserStatsService {
  /**
   * Gerar estatísticas completas
   */
  async generateStats(templateId?: string): Promise<GenerateStatsResult> {
    try {
      logger.debug(
        { templateId },
        "Generating user stats"
      );

      const now = new Date();
      const dateRangeStart = this.getDateOffsetDays(now, STATS_DATE_RANGE_DAYS);
      const sevenDaysAgo = this.getDateOffsetDays(now, 7);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Fetch all data
      const [allSubmissions, allDocuments, allChatMessages, allUsers, allTemplates, allQuestions] = await Promise.all([
        prisma.formSubmission.findMany({
          include: { user: true, template: true },
        }),
        prisma.document.findMany({
          include: { uploader: true },
        }),
        prisma.chatMessage.findMany({
          include: { user: true },
        }),
        prisma.user.findMany(),
        prisma.template.findMany(),
        prisma.question.findMany(),
      ]);

      // Filter by date range
      const submissionsLast30 = allSubmissions.filter(s => new Date(s.submittedAt) >= dateRangeStart);
      const submissionsLast7 = allSubmissions.filter(s => new Date(s.submittedAt) >= sevenDaysAgo);
      const submissionsToday = allSubmissions.filter(s => new Date(s.submittedAt) >= todayStart);

      const documentsLast30 = allDocuments.filter(d => new Date(d.uploadedAt) >= dateRangeStart);
      const documentsLast7 = allDocuments.filter(d => new Date(d.uploadedAt) >= sevenDaysAgo);

      const chatMessagesLast30 = allChatMessages.filter(m => new Date(m.createdAt) >= dateRangeStart);
      const chatMessagesLast7 = allChatMessages.filter(m => new Date(m.createdAt) >= sevenDaysAgo);

      // Aggregate trends by day
      const submissionsByDay = this.aggregateSubmissionsByDay(submissionsLast30, dateRangeStart, now);
      const documentsByDay = this.aggregateDocumentsByDay(documentsLast30, dateRangeStart, now);
      const chatMessagesByDay = this.aggregateChatMessagesByDay(chatMessagesLast30, dateRangeStart, now);

      // Calculate user stats
      const userStatsMap = new Map<string, UserStats>();

      allUsers.forEach(user => {
        userStatsMap.set(user.id, {
          userId: user.id,
          clerkId: user.id,
          email: user.email,
          firstName: user.firstName || user.name?.split(' ')[0],
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' '),
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          totalSubmissions: 0,
          totalTemplates: 0,
          totalQuestions: 0,
          totalDocuments: 0,
          processedDocuments: 0,
          totalChunks: 0,
          totalChatMessages: 0,
          totalUserMessages: 0,
          totalConversations: 0,
          activeDaysLast30: 0,
          submissionsByDay: {},
          templateDistribution: {},
          createdAt: user.createdAt,
        });
      });

      // Populate submissions
      submissionsLast30.forEach(submission => {
        const stat = userStatsMap.get(submission.submittedBy);
        if (stat) {
          stat.totalSubmissions++;
          const dateStr = new Date(submission.submittedAt).toISOString().split('T')[0];
          stat.submissionsByDay[dateStr] = (stat.submissionsByDay[dateStr] || 0) + 1;
        }
      });

      allSubmissions.forEach(submission => {
        const stat = userStatsMap.get(submission.submittedBy);
        if (stat) stat.totalSubmissions++;
      });

      // Populate documents
      allDocuments.forEach(document => {
        const stat = userStatsMap.get(document.uploadedBy);
        if (stat) {
          stat.totalDocuments++;
          if (document.processedAt) stat.processedDocuments++;
        }
      });

      // Populate chat messages
      allChatMessages.forEach(message => {
        const stat = userStatsMap.get(message.userId);
        if (stat) {
          stat.totalChatMessages++;
          if (message.role === 'user') stat.totalUserMessages++;
        }
      });

      // Calculate unique conversations and active days
      const userConversations = new Map<string, Set<string>>();
      allChatMessages.forEach(message => {
        if (!userConversations.has(message.userId)) {
          userConversations.set(message.userId, new Set());
        }
        userConversations.get(message.userId)!.add(message.conversationId);
      });

      userConversations.forEach((conversations, userId) => {
        const stat = userStatsMap.get(userId);
        if (stat) stat.totalConversations = conversations.size;
      });

      // Calculate active days in last 30 days
      const userActiveDays = new Map<string, Set<string>>();
      submissionsLast30.forEach(submission => {
        const dateStr = new Date(submission.submittedAt).toISOString().split('T')[0];
        if (!userActiveDays.has(submission.submittedBy)) {
          userActiveDays.set(submission.submittedBy, new Set());
        }
        userActiveDays.get(submission.submittedBy)!.add(dateStr);
      });
      chatMessagesLast30.forEach(message => {
        const dateStr = new Date(message.createdAt).toISOString().split('T')[0];
        if (!userActiveDays.has(message.userId)) {
          userActiveDays.set(message.userId, new Set());
        }
        userActiveDays.get(message.userId)!.add(dateStr);
      });

      userActiveDays.forEach((days, userId) => {
        const stat = userStatsMap.get(userId);
        if (stat) stat.activeDaysLast30 = days.size;
      });

      const users = Array.from(userStatsMap.values());

      // Calculate aggregate stats
      const totalUsers = allUsers.length;
      const pendingUsers = allUsers.filter(u => u.status === 'pending').length;
      const approvedUsers = allUsers.filter(u => u.status === 'approved').length;
      const rejectedUsers = allUsers.filter(u => u.status === 'rejected').length;
      const activeUsersLast30 = users.filter(u => u.activeDaysLast30 > 0).length;
      const inactiveUsers = totalUsers - activeUsersLast30;
      const totalSubmissions = allSubmissions.length;
      const avgSubmissionsPerUser = totalUsers > 0 ? Math.round(totalSubmissions / totalUsers) : 0;
      const totalDocuments = allDocuments.length;
      const processedDocuments = allDocuments.filter(d => d.processedAt).length;
      const avgDocumentsPerUser = totalUsers > 0 ? Math.round(totalDocuments / totalUsers) : 0;
      const totalChatMessages = allChatMessages.length;
      const userMessages = allChatMessages.filter(m => m.role === 'user').length;
      const assistantMessages = allChatMessages.filter(m => m.role === 'assistant').length;

      const conversationIds = new Set<string>();
      allChatMessages.forEach(m => conversationIds.add(m.conversationId));
      const uniqueConversations = conversationIds.size;

      const avgChatMessagesPerUser = totalUsers > 0 ? Math.round(totalChatMessages / totalUsers) : 0;
      const avgActiveDays = activeUsersLast30 > 0 ? Math.round(users.reduce((sum, u) => sum + u.activeDaysLast30, 0) / activeUsersLast30) : 0;

      // Calculate total chunks and templates
      const totalChunks = await prisma.documentChunk.count();
      const totalTemplates = allTemplates.length;
      const totalQuestions = allQuestions.length;

      return {
        users,
        stats: {
          totalUsers,
          pendingUsers,
          approvedUsers,
          rejectedUsers,
          activeUsersLast30,
          inactiveUsers,
          totalSubmissions,
          submissionsLast30: submissionsLast30.length,
          submissionsLast7: submissionsLast7.length,
          submissionsToday: submissionsToday.length,
          avgSubmissionsPerUser,
          totalTemplates,
          totalQuestions,
          totalDocuments,
          processedDocuments,
          documentsLast30: documentsLast30.length,
          documentsLast7: documentsLast7.length,
          totalChunks,
          avgDocumentsPerUser,
          totalChatMessages,
          userMessages,
          assistantMessages,
          uniqueConversations,
          chatMessagesLast30: chatMessagesLast30.length,
          chatMessagesLast7: chatMessagesLast7.length,
          avgChatMessagesPerUser,
          avgActiveDays,
        },
        trends: {
          submissionsByDay,
          documentsByDay,
          chatMessagesByDay,
        },
      };
    } catch (error) {
      logger.error({ error }, "Error generating stats");
      throw error;
    }
  }

  /**
   * Agregar submissões por dia
   */
  private aggregateSubmissionsByDay(
    submissions: SubmissionWithRelations[],
    startDate: Date,
    endDate: Date
  ): Record<string, number> {
    const result: Record<string, number> = {};

    // Inicializar intervalo de datas
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      result[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Contar por dia
    submissions.forEach((submission) => {
      const dateStr = new Date(submission.submittedAt)
        .toISOString()
        .split("T")[0];
      if (result[dateStr] !== undefined) {
        result[dateStr]++;
      }
    });

    return result;
  }

  /**
   * Agregar documentos por dia
   */
  private aggregateDocumentsByDay(
    documents: any[],
    startDate: Date,
    endDate: Date
  ): Record<string, number> {
    const result: Record<string, number> = {};

    // Inicializar intervalo de datas
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      result[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Contar por dia
    documents.forEach((doc) => {
      const dateStr = new Date(doc.uploadedAt)
        .toISOString()
        .split("T")[0];
      if (result[dateStr] !== undefined) {
        result[dateStr]++;
      }
    });

    return result;
  }

  /**
   * Agregar mensagens de chat por dia
   */
  private aggregateChatMessagesByDay(
    messages: any[],
    startDate: Date,
    endDate: Date
  ): Record<string, number> {
    const result: Record<string, number> = {};

    // Inicializar intervalo de datas
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      result[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Contar por dia
    messages.forEach((message) => {
      const dateStr = new Date(message.createdAt)
        .toISOString()
        .split("T")[0];
      if (result[dateStr] !== undefined) {
        result[dateStr]++;
      }
    });

    return result;
  }

  /**
   * Agregar por usuário
   * ANTES: Map manual (20 linhas)
   * DEPOIS: Função reutilizável (15 linhas)
   */
  private aggregateByUser(submissions: SubmissionWithRelations[]): UserStat[] {
    const userMap = new Map<string, UserStat>();

    submissions.forEach((submission) => {
      const userId = submission.user.id;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: submission.user.name || submission.user.email,
          submissionCount: 0,
          lastSubmission: submission.submittedAt,
        });
      }

      const user = userMap.get(userId)!;
      user.submissionCount++;
      if (submission.submittedAt > user.lastSubmission) {
        user.lastSubmission = submission.submittedAt;
      }
    });

    return Array.from(userMap.values()).sort(
      (a, b) => b.submissionCount - a.submissionCount
    );
  }

  /**
   * Agregar por template
   */
  private aggregateByTemplate(
    submissions: SubmissionWithRelations[]
  ): TemplateStat[] {
    const templateMap = new Map<string, TemplateStat>();

    submissions.forEach((submission) => {
      const templateId = submission.template.id;

      if (!templateMap.has(templateId)) {
        templateMap.set(templateId, {
          templateId,
          templateName: submission.template.title,
          submissionCount: 0,
        });
      }

      const template = templateMap.get(templateId)!;
      template.submissionCount++;
    });

    return Array.from(templateMap.values()).sort(
      (a, b) => b.submissionCount - a.submissionCount
    );
  }

  /**
   * Gerar trending (questões mais respondidas)
   */
  async getTrending(days: number = STATS_DATE_RANGE_DAYS): Promise<TrendingQuestion[]> {
    try {
      const since = this.getDateOffsetDays(new Date(), days);

      const submissions = await prisma.formSubmission.findMany({
        where: {
          submittedAt: { gte: since },
        },
        include: {
          template: {
            include: {
              questions: {
                include: { question: true },
              },
            },
          },
        },
      });

      const questionMap = new Map<string, TrendingQuestion>();

      submissions.forEach((submission) => {
        submission.template.questions.forEach((tq) => {
          const qId = tq.question.id;
          if (!questionMap.has(qId)) {
            questionMap.set(qId, {
              questionId: qId,
              title: tq.question.title,
              count: 0,
            });
          }
          questionMap.get(qId)!.count++;
        });
      });

      return Array.from(questionMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (error) {
      logger.error({ error }, "Error getting trending");
      throw error;
    }
  }

  /**
   * Helper para calcular data no passado
   */
  private getDateOffsetDays(fromDate: Date, daysOffset: number): Date {
    const result = new Date(fromDate);
    result.setDate(result.getDate() - daysOffset);
    return result;
  }
}

export const userStatsService = new UserStatsService();
