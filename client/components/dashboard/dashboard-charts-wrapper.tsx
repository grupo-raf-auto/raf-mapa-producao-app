'use client';

import { useState } from 'react';
import { TimeFilter, TimeFilterType } from './time-filter';
import { AnimatedChartCard } from '@/components/ui/animated-card';
import {
  TrendingUp,
  Building2,
  Shield,
  MapPin,
} from 'lucide-react';
import { SalesTimelineChart } from './sales-timeline-chart';
import { SalesByBancoChart } from './sales-by-banco-chart';
import { TopBancosPieChart } from './top-bancos-pie-chart';
import { SalesBySeguradoraChart } from './sales-by-seguradora-chart';
import { SalesByDistritoChart } from './sales-by-distrito-chart';
import { QuestionsChart } from './questions-chart';
import { ActivityChart } from './activity-chart';

interface DashboardChartsWrapperProps {
  salesStats: {
    byMonth?: { month: string; count: number; totalValue: number }[];
    byBanco?: { name: string; count: number; totalValue: number }[];
    bySeguradora?: { name: string; count: number; totalValue: number }[];
    byDistrito?: { name: string; count: number; totalValue: number }[];
  } | null;
}

// Função para filtrar dados por período
function filterDataByPeriod(
  data: { month: string; count: number; totalValue: number }[],
  period: TimeFilterType
): { month: string; count: number; totalValue: number }[] {
  if (!data || data.length === 0) return [];

  const now = new Date();
  let monthsToShow: number;

  switch (period) {
    case 'day':
      // Último mês (representando ~30 dias)
      monthsToShow = 1;
      break;
    case 'week':
      // Últimos 3 meses (representando ~12 semanas)
      monthsToShow = 3;
      break;
    case 'month':
      // Todos os meses disponíveis
      return data;
    default:
      return data;
  }

  // Ordenar dados por data (mais recente primeiro)
  const sortedData = [...data].sort((a, b) => {
    const [yearA, monthA] = a.month.split('-').map(Number);
    const [yearB, monthB] = b.month.split('-').map(Number);
    const dateA = new Date(yearA, monthA - 1);
    const dateB = new Date(yearB, monthB - 1);
    return dateB.getTime() - dateA.getTime();
  });

  // Retornar apenas os N meses mais recentes
  return sortedData.slice(0, monthsToShow).reverse();
}

export function DashboardChartsWrapper({ salesStats }: DashboardChartsWrapperProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('month');

  // Filtrar dados do timeline baseado no período selecionado
  const filteredTimelineData = salesStats?.byMonth
    ? filterDataByPeriod(salesStats.byMonth, timeFilter)
    : [];

  return (
    <div className="space-y-6">
      {/* Filtro de Tempo - Apenas para gráficos */}
      <div className="flex justify-end">
        <TimeFilter value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* Grid 3x2 - Estilo Moderno com Métricas Originais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Row 1 - Card 1: Evolução Temporal de Vendas */}
        {filteredTimelineData.length > 0 && (
          <AnimatedChartCard
            title="Evolução Temporal de Vendas"
            icon={<TrendingUp className="w-5 h-5" />}
            animationDelay={0.1}
          >
            <SalesTimelineChart data={filteredTimelineData} timeFilter={timeFilter} />
          </AnimatedChartCard>
        )}

        {/* Row 1 - Card 2: Vendas por Banco */}
        {salesStats?.byBanco && salesStats.byBanco.length > 0 && (
          <AnimatedChartCard
            title="Vendas por Banco"
            icon={<Building2 className="w-5 h-5" />}
            animationDelay={0.2}
          >
            <SalesByBancoChart data={salesStats.byBanco} />
          </AnimatedChartCard>
        )}

        {/* Row 1 - Card 3: Distribuição por Banco */}
        {salesStats?.byBanco && salesStats.byBanco.length > 0 && (
          <AnimatedChartCard
            title="Distribuição por Banco (Top 8)"
            icon={<Building2 className="w-5 h-5" />}
            animationDelay={0.3}
          >
            <TopBancosPieChart data={salesStats.byBanco} />
          </AnimatedChartCard>
        )}

        {/* Row 2 - Card 1: Vendas por Seguradora */}
        {salesStats?.bySeguradora && salesStats.bySeguradora.length > 0 && (
          <AnimatedChartCard
            title="Vendas por Seguradora"
            icon={<Shield className="w-5 h-5" />}
            animationDelay={0.4}
          >
            <SalesBySeguradoraChart data={salesStats.bySeguradora} />
          </AnimatedChartCard>
        )}

        {/* Row 2 - Card 2: Vendas por Distrito */}
        {salesStats?.byDistrito && salesStats.byDistrito.length > 0 && (
          <AnimatedChartCard
            title="Vendas por Distrito"
            icon={<MapPin className="w-5 h-5" />}
            animationDelay={0.5}
          >
            <SalesByDistritoChart data={salesStats.byDistrito} />
          </AnimatedChartCard>
        )}

        {/* Row 2 - Card 3: Questões por Categoria */}
        <AnimatedChartCard
          title="Questões por Categoria"
          animationDelay={0.6}
        >
          <QuestionsChart />
        </AnimatedChartCard>
      </div>

      {/* Atividade ao Longo do Tempo - Full Width */}
      <AnimatedChartCard
        title="Atividade ao Longo do Tempo"
        animationDelay={0.7}
      >
        <ActivityChart />
      </AnimatedChartCard>
    </div>
  );
}
