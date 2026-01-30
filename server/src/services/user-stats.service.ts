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
  totalSubmissions: number;
  uniqueUsers: number;
  submissionsByDay: Record<string, number>;
  userStats: UserStat[];
  templateStats: TemplateStat[];
  dateRange: {
    from: Date;
    to: Date;
  };
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

      // ✅ QUERY PARAMETRIZADA - Sem SQL Injection
      const allSubmissions = await prisma.formSubmission.findMany({
        where: {
          ...(templateId && { templateId }),
          submittedAt: {
            gte: dateRangeStart,
          },
        },
        include: { user: true, template: true },
        orderBy: { submittedAt: "desc" },
      });

      // Calcular agregações por dia
      const submissionsByDay = this.aggregateByDay(
        allSubmissions,
        dateRangeStart,
        now
      );

      // Calcular por usuário
      const userStats = this.aggregateByUser(allSubmissions);

      // Calcular por template
      const templateStats = this.aggregateByTemplate(allSubmissions);

      return {
        totalSubmissions: allSubmissions.length,
        uniqueUsers: userStats.length,
        submissionsByDay,
        userStats,
        templateStats,
        dateRange: {
          from: dateRangeStart,
          to: now,
        },
      };
    } catch (error) {
      logger.error({ error }, "Error generating stats");
      throw error;
    }
  }

  /**
   * Agregar submissões por dia
   * ANTES: Loop manual (20 linhas)
   * DEPOIS: Função reutilizável (10 linhas)
   */
  private aggregateByDay(
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
