"use client";

import { useState, useEffect } from "react";
import { KPICards } from "./kpi-cards";
import { DashboardChartsWrapper } from "./dashboard-charts-wrapper";
import { apiClient as api } from "@/lib/api-client";
import { DashboardHeader } from "@/components/ui/dashboard-header";
import { useModelContext } from "@/lib/context/model-context";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function DashboardContent() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeModel, loading: modelLoading } = useModelContext();

  const [yearlyStats, setYearlyStats] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [comparativeStats, setComparativeStats] = useState<any>(null);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await Promise.all([
        api.templates.getAll().catch(() => []),
        api.submissions.getStats({ detailed: true }).catch(() => null),
        api.submissions.getAll().catch(() => []),
        api.submissions.getYearlyStats().catch(() => ({ total: 0, totalValue: 0 })),
        api.submissions.getMonthlyStats().catch(() => ({ total: 0, totalValue: 0 })),
        // Load comparative stats (all users) for comparison charts
        api.submissions.getStats({ detailed: true, scope: "all" }).catch(() => null),
      ]);

      setTemplates(result[0] || []);
      setSalesStats(result[1]);
      setYearlyStats(result[3]);
      setMonthlyStats(result[4]);
      setComparativeStats(result[5]);

      // Ordenar por data e pegar as 5 mais recentes
      const sortedSubmissions = (result[2] || [])
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
      setRecentSubmissions(sortedSubmissions);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!modelLoading) {
      loadData();
    }
  }, [activeModel?.id, modelLoading]);

  const stats = {
    totalTemplates: templates.length,
    totalSubmissions: salesStats?.total || 0,
    totalValue: salesStats?.totalValue || 0,
    averageValue: salesStats?.averageValue || 0,
  };

  // Calcular tendências baseadas nos dados reais
  const monthlyData: { month: string; count: number; totalValue: number }[] =
    salesStats?.byMonth || [];
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0)
      return { change: "+0%", type: "neutral" as const };
    const change = ((current - previous) / previous) * 100;
    return {
      change: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
      type: change >= 0 ? ("up" as const) : ("down" as const),
    };
  };

  const countTrend = calculateTrend(
    currentMonth?.count || 0,
    previousMonth?.count || 0,
  );

  // Sparkline data from monthly submissions
  const sparklineFromMonthly = monthlyData.slice(-8).map((m) => m.count || 0);
  const sparklineValues = monthlyData.slice(-8).map((m) => m.totalValue || 0);

  // KPI Cards adaptados ao contexto de Produção
  const kpiCards = [
    {
      title: "Total Acumulado ao Ano",
      value: (yearlyStats?.totalValue || 0).toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      iconName: "Euro" as const,
      trendChange: `${yearlyStats?.total || 0} submissões`,
      trendType: "neutral" as const,
      sparklineType: "area" as const,
      sparklineData:
        sparklineValues.length > 0
          ? sparklineValues
          : [30, 45, 35, 50, 40, 55, 45, 60],
      colorVariant: "blue" as const,
    },
    {
      title: "Total Mensal",
      value: (monthlyStats?.totalValue || 0).toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      iconName: "Calendar" as const,
      trendChange: `${monthlyStats?.total || 0} submissões`,
      trendType: "neutral" as const,
      sparklineType: "bars" as const,
      sparklineData:
        sparklineFromMonthly.length > 0
          ? sparklineFromMonthly.slice(-8)
          : [20, 35, 25, 40, 30, 45, 35, 50],
      colorVariant: "purple" as const,
    },
    {
      title: "Total Submissões",
      value: stats.totalSubmissions.toLocaleString("pt-PT"),
      iconName: "FileStack" as const,
      trendChange: countTrend.change,
      trendType: countTrend.type,
      sparklineType: "bars" as const,
      sparklineData:
        sparklineFromMonthly.length > 0
          ? sparklineFromMonthly
          : [20, 35, 25, 40, 30, 45, 35, 50],
      colorVariant: "teal" as const,
    },
    {
      title: "Valor Médio",
      value: stats.averageValue.toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      iconName: "TrendingUp" as const,
      trendChange:
        stats.totalSubmissions > 0
          ? "+" + stats.totalTemplates + " formulários"
          : "0 formulários",
      trendType: "neutral" as const,
      sparklineType: "line" as const,
      sparklineData:
        sparklineValues.length > 0
          ? sparklineValues.map((v, i) =>
              sparklineFromMonthly[i]
                ? Math.round(v / sparklineFromMonthly[i])
                : 0,
            )
          : [40, 35, 45, 30, 50, 35, 45, 40],
      colorVariant: "green" as const,
    },
  ];

  if (loading || modelLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader />
        <Card>
          <CardContent className="py-8 text-center flex flex-col items-center gap-3">
            <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardHeader />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium mb-2">
              Erro ao carregar dashboard
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <DashboardHeader />

      {/* KPI Cards Row */}
      <KPICards cards={kpiCards} />

      {/* Charts Section */}
      <DashboardChartsWrapper
        salesStats={salesStats}
        comparativeStats={comparativeStats}
        recentSubmissions={recentSubmissions}
      />
    </div>
  );
}
