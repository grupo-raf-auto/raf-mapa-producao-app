import { prisma } from "../lib/prisma";
import { serverCache } from "../lib/cache";

// ============ Types ============

type Answer = { questionId: string; answer: string };

export interface StatsFilters {
  templateId?: string;
  submittedBy?: string;
  modelContext?: string;
}

export interface AggregatedData {
  count: number;
  totalValue: number;
}

export interface NamedAggregation extends AggregatedData {
  name: string;
  averageValue?: number;
}

export interface UserAggregation extends AggregatedData {
  userId: string;
  name: string;
  averageValue: number;
}

export interface MonthlyData {
  month: string;
  count: number;
  totalValue: number;
}

export interface GrowthRate {
  month: string;
  growthRate: number;
  previousValue: number;
  currentValue: number;
}

export interface SalesStats {
  total: number;
  totalValue: number;
  averageValue: number;
  byBanco: NamedAggregation[];
  bySeguradora: NamedAggregation[];
  byDistrito: NamedAggregation[];
  byMonth: MonthlyData[];
  byUser: UserAggregation[];
  byTemplate: NamedAggregation[];
  byAgente: NamedAggregation[];
  byRating: { rating: string; count: number; totalValue: number }[];
  valueRanges: { range: string; count: number }[];
  growthRates: GrowthRate[];
}

// ============ Helper Functions ============

function parseAnswersArray(answers: unknown): Answer[] {
  return Array.isArray(answers) ? (answers as Answer[]) : [];
}

function parseValue(valueStr: string): number {
  const parsed = parseFloat(
    valueStr.replace(/[^\d.,]/g, "").replace(",", ".")
  );
  return isNaN(parsed) ? 0 : parsed;
}

function getAnswerValue(
  answers: Answer[],
  questionId: string | undefined
): string | undefined {
  if (!questionId) return undefined;
  const answer = answers.find((a) => a.questionId === questionId);
  return answer?.answer?.trim();
}

function aggregateByKey(
  aggregation: Record<string, AggregatedData>,
  key: string,
  value: number
): void {
  if (!aggregation[key]) {
    aggregation[key] = { count: 0, totalValue: 0 };
  }
  aggregation[key].count++;
  aggregation[key].totalValue += value;
}

function toNamedAggregationArray(
  aggregation: Record<string, AggregatedData>,
  includeAverage = true
): NamedAggregation[] {
  return Object.entries(aggregation)
    .map(([name, data]) => ({
      name,
      count: data.count,
      totalValue: data.totalValue,
      ...(includeAverage && {
        averageValue: data.count > 0 ? data.totalValue / data.count : 0,
      }),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

function getValueRange(value: number): string {
  if (value < 50000) return "0-50k";
  if (value < 100000) return "50k-100k";
  if (value < 200000) return "100k-200k";
  if (value < 500000) return "200k-500k";
  return "500k+";
}

function calculateGrowthRates(monthlyData: MonthlyData[]): GrowthRate[] {
  return monthlyData.map((item, index) => {
    if (index === 0) {
      return {
        month: item.month,
        growthRate: 0,
        previousValue: 0,
        currentValue: item.totalValue,
      };
    }
    const previousValue = monthlyData[index - 1].totalValue;
    const growthRate =
      previousValue > 0
        ? ((item.totalValue - previousValue) / previousValue) * 100
        : 0;
    return {
      month: item.month,
      growthRate,
      previousValue,
      currentValue: item.totalValue,
    };
  });
}

// ============ Main Service ============

export class StatsService {
  private static readonly CACHE_TTL = 30000; // 30 seconds cache

  /**
   * Calcula estatísticas detalhadas de vendas baseado em submissions
   * Optimized with caching for high-traffic scenarios
   */
  static async getSalesStats(filters: StatsFilters): Promise<SalesStats> {
    // Create cache key from filters
    const cacheKey = `stats:${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = serverCache.get<SalesStats>(cacheKey);
    if (cached) {
      return cached;
    }

    // Buscar dados necessários em paralelo
    const [submissions, allQuestions, allTemplates, users] = await Promise.all([
      prisma.formSubmission.findMany({
        where: filters,
        orderBy: { submittedAt: "desc" },
        // Limit to prevent memory issues with large datasets
        take: 10000,
      }),
      prisma.question.findMany({}),
      prisma.template.findMany({ select: { id: true, title: true } }),
      prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    ]);

    // Mapear IDs de questões relevantes
    const questionIds = {
      valor: allQuestions.find((q) => q.title === "Valor")?.id,
      banco: allQuestions.find((q) => q.title === "Banco")?.id,
      seguradora: allQuestions.find((q) => q.title === "Seguradora")?.id,
      distrito: allQuestions.find((q) => q.title === "Distrito cliente")?.id,
      agente: allQuestions.find((q) => q.title === "Agente")?.id,
      rating: allQuestions.find((q) => q.title === "Rating cliente")?.id,
    };

    // Criar mapas para lookup rápido
    const templateMap = new Map(allTemplates.map((t) => [t.id, t.title]));
    const userMap = new Map(
      users.map((u) => [u.id, u.name || u.email || "Desconhecido"])
    );

    // Inicializar agregações
    const aggregations = {
      byBanco: {} as Record<string, AggregatedData>,
      bySeguradora: {} as Record<string, AggregatedData>,
      byDistrito: {} as Record<string, AggregatedData>,
      byMonth: {} as Record<string, AggregatedData>,
      byUser: {} as Record<string, AggregatedData & { userName: string }>,
      byTemplate: {} as Record<string, AggregatedData>,
      byAgente: {} as Record<string, AggregatedData>,
      byRating: {} as Record<string, AggregatedData>,
      valueRanges: {
        "0-50k": 0,
        "50k-100k": 0,
        "100k-200k": 0,
        "200k-500k": 0,
        "500k+": 0,
      } as Record<string, number>,
    };

    let totalValue = 0;
    let validValuesCount = 0;

    // Processar cada submission
    for (const submission of submissions) {
      const answers = parseAnswersArray(submission.answers);

      // Extrair valor
      let valor = 0;
      const valorStr = getAnswerValue(answers, questionIds.valor);
      if (valorStr) {
        valor = parseValue(valorStr);
        if (valor > 0) {
          totalValue += valor;
          validValuesCount++;
          aggregations.valueRanges[getValueRange(valor)]++;
        }
      }

      // Agregar por banco
      const banco = getAnswerValue(answers, questionIds.banco);
      if (banco) aggregateByKey(aggregations.byBanco, banco, valor);

      // Agregar por seguradora
      const seguradora = getAnswerValue(answers, questionIds.seguradora);
      if (seguradora) aggregateByKey(aggregations.bySeguradora, seguradora, valor);

      // Agregar por distrito
      const distrito = getAnswerValue(answers, questionIds.distrito);
      if (distrito) aggregateByKey(aggregations.byDistrito, distrito, valor);

      // Agregar por mês
      if (submission.submittedAt) {
        const d = new Date(submission.submittedAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        aggregateByKey(aggregations.byMonth, monthKey, valor);
      }

      // Agregar por colaborador
      if (submission.submittedBy) {
        const userId = submission.submittedBy;
        const userName = userMap.get(userId) || "Desconhecido";
        if (!aggregations.byUser[userId]) {
          aggregations.byUser[userId] = { count: 0, totalValue: 0, userName };
        }
        aggregations.byUser[userId].count++;
        aggregations.byUser[userId].totalValue += valor;
      }

      // Agregar por template
      const templateTitle = templateMap.get(submission.templateId) || "Desconhecido";
      aggregateByKey(aggregations.byTemplate, templateTitle, valor);

      // Agregar por agente
      const agente = getAnswerValue(answers, questionIds.agente);
      if (agente) aggregateByKey(aggregations.byAgente, agente, valor);

      // Agregar por rating
      const rating = getAnswerValue(answers, questionIds.rating);
      if (rating) aggregateByKey(aggregations.byRating, rating, valor);
    }

    // Formatar dados mensais ordenados
    const monthlyData = Object.entries(aggregations.byMonth)
      .map(([month, data]) => ({
        month,
        count: data.count,
        totalValue: data.totalValue,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Construir resultado final
    const result: SalesStats = {
      total: submissions.length,
      totalValue,
      averageValue: validValuesCount > 0 ? totalValue / validValuesCount : 0,
      byBanco: toNamedAggregationArray(aggregations.byBanco),
      bySeguradora: toNamedAggregationArray(aggregations.bySeguradora),
      byDistrito: toNamedAggregationArray(aggregations.byDistrito, false),
      byMonth: monthlyData,
      byUser: Object.entries(aggregations.byUser)
        .map(([userId, data]) => ({
          userId,
          name: data.userName,
          count: data.count,
          totalValue: data.totalValue,
          averageValue: data.count > 0 ? data.totalValue / data.count : 0,
        }))
        .sort((a, b) => b.totalValue - a.totalValue),
      byTemplate: toNamedAggregationArray(aggregations.byTemplate, false),
      byAgente: toNamedAggregationArray(aggregations.byAgente),
      byRating: Object.entries(aggregations.byRating)
        .map(([rating, data]) => ({
          rating,
          count: data.count,
          totalValue: data.totalValue,
        }))
        .sort((a, b) => b.count - a.count),
      valueRanges: Object.entries(aggregations.valueRanges).map(
        ([range, count]) => ({ range, count })
      ),
      growthRates: calculateGrowthRates(monthlyData),
    };

    // Cache the result
    serverCache.set(cacheKey, result, this.CACHE_TTL);
    
    return result;
  }

  /**
   * Retorna contagem simples de submissions
   * Optimized with caching
   */
  static async getSubmissionCount(filters: StatsFilters): Promise<number> {
    const cacheKey = `count:${JSON.stringify(filters)}`;
    
    const cached = serverCache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    const count = await prisma.formSubmission.count({ where: filters });
    serverCache.set(cacheKey, count, this.CACHE_TTL);
    
    return count;
  }

  /**
   * Invalidate stats cache for a specific user/model
   * Call this when submissions are created/updated/deleted
   */
  static invalidateCache(userId?: string, modelContext?: string): void {
    if (userId) {
      serverCache.deletePattern(`stats:.*"submittedBy":"${userId}".*`);
      serverCache.deletePattern(`count:.*"submittedBy":"${userId}".*`);
    }
    if (modelContext) {
      serverCache.deletePattern(`stats:.*"modelContext":"${modelContext}".*`);
      serverCache.deletePattern(`count:.*"modelContext":"${modelContext}".*`);
    }
    // If no specific filters, clear all stats cache
    if (!userId && !modelContext) {
      serverCache.deletePattern(`^stats:`);
      serverCache.deletePattern(`^count:`);
    }
  }
}
