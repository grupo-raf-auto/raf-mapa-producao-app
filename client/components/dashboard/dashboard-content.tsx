'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KPICards } from './kpi-cards';
import { DashboardChartsWrapper } from './dashboard-charts-wrapper';
import { apiClient as api, clearStatsCache } from '@/lib/api-client';
import { DashboardHeader } from '@/components/ui/dashboard-header';
import { useModelContext } from '@/lib/context/model-context';
import { useUserModels } from '@/lib/hooks/use-user-models';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export function DashboardContent() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeModel, loading: modelLoading } = useModelContext();
  const { models, loading: modelsLoading } = useUserModels();

  const [yearlyStats, setYearlyStats] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [comparativeStats, setComparativeStats] = useState<any>(null);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      clearStatsCache();

      // Período global: diário, para o eixo X mostrar o dia da apólice
      const result = await Promise.all([
        api.templates.getAll().catch(() => []),
        api.submissions
          .getStats({ detailed: true, granularity: 'daily' })
          .catch(() => null),
        api.submissions.getAll().catch(() => []),
        api.submissions
          .getYearlyStats()
          .catch(() => ({ total: 0, totalValue: 0 })),
        api.submissions
          .getMonthlyStats()
          .catch(() => ({ total: 0, totalValue: 0 })),
        api.submissions
          .getStats({
            detailed: true,
            scope: 'all',
            granularity: 'daily',
          })
          .catch(() => null),
      ]);

      setTemplates(result[0] || []);
      setSalesStats(result[1]);
      setYearlyStats(result[3]);
      setMonthlyStats(result[4]);
      setComparativeStats(result[5]);

      const sortedSubmissions = (result[2] || [])
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
      setRecentSubmissions(sortedSubmissions);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Se não há modelos após carregar, redirecionar para seleção (evita "Nenhum modelo" no dashboard)
  useEffect(() => {
    if (modelsLoading || modelLoading) return;
    if (!models || models.length === 0) {
      router.replace('/select-models');
      return;
    }
  }, [modelsLoading, modelLoading, models, router]);

  // Carregamento inicial e ao mudar de modelo (período global único: mensal)
  useEffect(() => {
    if (modelLoading) return;
    loadData();
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
      return { change: '+0%', type: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      type: change >= 0 ? ('up' as const) : ('down' as const),
    };
  };

  const countTrend = calculateTrend(
    currentMonth?.count || 0,
    previousMonth?.count || 0,
  );

  // Sparkline data from monthly submissions
  const sparklineFromMonthly = monthlyData.slice(-8).map((m) => m.count || 0);

  // Verificar se o modelo ativo é Seguros
  const isSeguroModel = activeModel?.modelType === 'seguro';

  // KPI Cards adaptados ao contexto de Produção
  const kpiCards = [
    {
      title: isSeguroModel ? 'Apólices Anuais' : 'Total Acumulado ao Ano',
      value: isSeguroModel
        ? (yearlyStats?.total || 0).toLocaleString('pt-PT')
        : (yearlyStats?.totalValue || 0).toLocaleString('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }),
      iconName: isSeguroModel ? ('Shield' as const) : ('Euro' as const),
      trendChange: isSeguroModel
        ? 'seguros feitos'
        : `${yearlyStats?.total || 0} submissões`,
      trendType: 'neutral' as const,
      sparklineType: 'area' as const,
      sparklineData:
        sparklineFromMonthly.length > 0 ? sparklineFromMonthly : [],
      colorVariant: 'blue' as const,
    },
    {
      title: isSeguroModel ? 'Apólices Mensais' : 'Total Mensal',
      value: isSeguroModel
        ? (monthlyStats?.total || 0).toLocaleString('pt-PT')
        : (monthlyStats?.totalValue || 0).toLocaleString('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }),
      iconName: isSeguroModel
        ? ('ShieldCheck' as const)
        : ('Calendar' as const),
      trendChange: isSeguroModel
        ? 'este mês'
        : `${monthlyStats?.total || 0} submissões`,
      trendType: 'neutral' as const,
      sparklineType: 'bars' as const,
      sparklineData:
        sparklineFromMonthly.length > 0 ? sparklineFromMonthly.slice(-8) : [],
      colorVariant: 'purple' as const,
    },
    {
      title: 'Total Submissões',
      value: stats.totalSubmissions.toLocaleString('pt-PT'),
      iconName: 'FileStack' as const,
      trendChange: countTrend.change,
      trendType: countTrend.type,
      sparklineType: 'bars' as const,
      sparklineData:
        sparklineFromMonthly.length > 0 ? sparklineFromMonthly : [],
      colorVariant: 'teal' as const,
    },
    {
      title: isSeguroModel ? 'Valor Total de Seguros' : 'Valor Total',
      value: (stats.totalValue || 0).toLocaleString('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      iconName: 'Euro' as const,
      trendChange: isSeguroModel ? 'valor total' : 'valor acumulado',
      trendType: 'neutral' as const,
      sparklineType: 'area' as const,
      sparklineData:
        sparklineFromMonthly.length > 0
          ? monthlyData.slice(-8).map((m) => m.totalValue || 0)
          : [],
      colorVariant: 'green' as const,
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
