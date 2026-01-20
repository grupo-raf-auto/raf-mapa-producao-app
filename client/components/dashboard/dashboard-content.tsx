import { KPICards } from './kpi-cards';
import { DashboardChartsWrapper } from './dashboard-charts-wrapper';
import { api } from '@/lib/api';

export async function DashboardContent() {
  let templates = [];
  let salesStats = null;

  try {
    const result = await Promise.all([
      api.templates.getAll(),
      api.submissions.getStats({ detailed: true }).catch(() => null),
    ]);
    templates = result[0] || [];
    salesStats = result[1];
  } catch (error) {
    console.error('Error fetching data:', error);
    // Continue with empty data if API fails
  }

  const stats = {
    totalTemplates: templates.length,
    totalSubmissions: salesStats?.total || 0,
    totalValue: salesStats?.totalValue || 0,
    averageValue: salesStats?.averageValue || 0,
  };

  const kpiCards = [
    {
      title: 'Total de Vendas',
      value: stats.totalSubmissions,
      iconName: 'TrendingUp' as const,
      description: 'Número total de submissões',
    },
    {
      title: 'Valor Total',
      value: stats.totalValue.toLocaleString('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      iconName: 'Euro' as const,
      description: 'Soma de todos os valores',
    },
    {
      title: 'Valor Médio',
      value: stats.averageValue.toLocaleString('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      iconName: 'BarChart3' as const,
      description: 'Média por venda',
    },
    {
      title: 'Templates',
      value: stats.totalTemplates,
      iconName: 'FileStack' as const,
      description: 'Templates disponíveis',
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          Dashboard de Vendas
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Visão geral das métricas de vendas e performance
        </p>
      </div>

      {/* KPI Cards - Não afetados pelo filtro de tempo */}
      <KPICards cards={kpiCards} />

      {/* Gráficos com filtro de tempo */}
      <DashboardChartsWrapper salesStats={salesStats} />
    </div>
  );
}
