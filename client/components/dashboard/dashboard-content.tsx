import { KPICards } from './kpi-cards';
import { DashboardChartsWrapper } from './dashboard-charts-wrapper';
import { api } from '@/lib/api';

export async function DashboardContent() {
  let templates = [];
  let salesStats = null;
  let recentSubmissions = [];

  try {
    const result = await Promise.all([
      api.templates.getAll(),
      api.submissions.getStats({ detailed: true }).catch(() => null),
      api.submissions.getAll().catch(() => []),
    ]);
    templates = result[0] || [];
    salesStats = result[1];
    // Ordenar por data e pegar as 5 mais recentes
    recentSubmissions = (result[2] || [])
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  const stats = {
    totalTemplates: templates.length,
    totalSubmissions: salesStats?.total || 0,
    totalValue: salesStats?.totalValue || 0,
    averageValue: salesStats?.averageValue || 0,
  };

  // Calcular tendências baseadas nos dados reais
  const monthlyData: { month: string; count: number; totalValue: number }[] = salesStats?.byMonth || [];
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { change: '+0%', type: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      type: change >= 0 ? 'up' as const : 'down' as const,
    };
  };

  const valueTrend = calculateTrend(
    currentMonth?.totalValue || 0,
    previousMonth?.totalValue || 0
  );
  const countTrend = calculateTrend(
    currentMonth?.count || 0,
    previousMonth?.count || 0
  );

  // Sparkline data from monthly submissions
  const sparklineFromMonthly = monthlyData.slice(-8).map(m => m.count || 0);
  const sparklineValues = monthlyData.slice(-8).map(m => m.totalValue || 0);

  // KPI Cards adaptados ao contexto de Produção
  const kpiCards = [
    {
      title: 'Total Produção',
      value: stats.totalValue.toLocaleString('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      iconName: 'Euro' as const,
      trendChange: valueTrend.change,
      trendType: valueTrend.type,
      sparklineType: 'bars' as const,
      sparklineData: sparklineValues.length > 0 ? sparklineValues : [30, 45, 35, 50, 40, 55, 45, 60],
      colorVariant: 'blue' as const,
    },
    {
      title: 'Total Submissões',
      value: stats.totalSubmissions.toLocaleString('pt-PT'),
      iconName: 'FileStack' as const,
      trendChange: countTrend.change,
      trendType: countTrend.type,
      sparklineType: 'bars' as const,
      sparklineData: sparklineFromMonthly.length > 0 ? sparklineFromMonthly : [20, 35, 25, 40, 30, 45, 35, 50],
      colorVariant: 'teal' as const,
    },
    {
      title: 'Valor Médio',
      value: stats.averageValue.toLocaleString('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      iconName: 'TrendingUp' as const,
      trendChange: stats.totalSubmissions > 0 ? '+' + stats.totalTemplates + ' formulários' : '0 formulários',
      trendType: 'neutral' as const,
      sparklineType: 'line' as const,
      sparklineData: sparklineValues.length > 0
        ? sparklineValues.map((v, i) => sparklineFromMonthly[i] ? Math.round(v / sparklineFromMonthly[i]) : 0)
        : [40, 35, 45, 30, 50, 35, 45, 40],
      colorVariant: 'green' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <KPICards cards={kpiCards} />

      {/* Charts Section */}
      <DashboardChartsWrapper salesStats={salesStats} recentSubmissions={recentSubmissions} />
    </div>
  );
}
