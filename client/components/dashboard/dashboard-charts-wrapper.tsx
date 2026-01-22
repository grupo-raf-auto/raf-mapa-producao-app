'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TimeFilter, TimeFilterType } from './time-filter';
import { DashboardStatusChart } from './dashboard-status-chart';
import { OverallSellProgressChart } from './overall-sell-progress-chart';
import { VisitorAnalysisChart } from './visitor-analysis-chart';
import { EmployeeTaskTable } from './employee-task-table';
import { SeguradoraChart } from './seguradora-chart';
import { TicketMedioChart } from './ticket-medio-chart';
import { ColaboradorPerformanceChart } from './colaborador-performance-chart';
import { ValueDistributionChart } from './value-distribution-chart';
import { GrowthRateChart } from './growth-rate-chart';

interface Submission {
  id: string;
  templateId: string;
  template?: { name: string };
  answers: { questionId: string; question?: { text: string }; answer: string }[];
  createdAt: string;
  user?: { name: string; email: string };
}

interface DashboardChartsWrapperProps {
  salesStats: {
    byMonth?: { month: string; count: number; totalValue: number }[];
    byBanco?: { name: string; count: number; totalValue: number; averageValue?: number }[];
    bySeguradora?: { name: string; count: number; totalValue: number; averageValue?: number }[];
    byDistrito?: { name: string; count: number; totalValue: number }[];
    byUser?: { userId: string; name: string; count: number; totalValue: number; averageValue?: number }[];
    valueRanges?: { range: string; count: number }[];
    growthRates?: { month: string; growthRate: number; previousValue: number; currentValue: number }[];
    averageValue?: number;
  } | null;
  recentSubmissions?: Submission[];
}

// Filter data by time period
function filterDataByPeriod(
  data: { month: string; count: number; totalValue: number }[],
  period: TimeFilterType
): { month: string; count: number; totalValue: number }[] {
  if (!data || data.length === 0) return [];

  let monthsToShow: number;
  switch (period) {
    case 'day':
      monthsToShow = 1;
      break;
    case 'week':
      monthsToShow = 3;
      break;
    case 'month':
      return data;
    default:
      return data;
  }

  const sortedData = [...data].sort((a, b) => {
    const [yearA, monthA] = a.month.split('-').map(Number);
    const [yearB, monthB] = b.month.split('-').map(Number);
    const dateA = new Date(yearA, monthA - 1);
    const dateB = new Date(yearB, monthB - 1);
    return dateB.getTime() - dateA.getTime();
  });

  return sortedData.slice(0, monthsToShow).reverse();
}

// Animation component wrapper
function AnimatedSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

export function DashboardChartsWrapper({ salesStats, recentSubmissions = [] }: DashboardChartsWrapperProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('month');

  const filteredTimelineData = salesStats?.byMonth
    ? filterDataByPeriod(salesStats.byMonth, timeFilter)
    : [];

  return (
    <div className="space-y-5">
      {/* First Row: Evolução Produção (2/3) + Produção por Banco (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Evolução da Produção - Area Chart */}
        <AnimatedSection className="lg:col-span-2" delay={0}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="chart-card-title">Evolução da Produção</h3>
                <div className="chart-legend mt-2">
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot" style={{ backgroundColor: '#2563EB' }} />
                    Submissões
                  </span>
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot" style={{ backgroundColor: '#F97316' }} />
                    Valor Total
                  </span>
                </div>
              </div>
              <TimeFilter value={timeFilter} onChange={setTimeFilter} />
            </div>
            <DashboardStatusChart data={filteredTimelineData} timeFilter={timeFilter} />
          </div>
        </AnimatedSection>

        {/* Produção por Banco - Vertical Bar Chart */}
        <AnimatedSection delay={0.1}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Produção por Banco</h3>
              <div className="chart-legend">
                <span className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ backgroundColor: '#2563EB' }} />
                  Quantidade
                </span>
                <span className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ backgroundColor: '#14B8A6' }} />
                  Valor
                </span>
              </div>
            </div>
            <OverallSellProgressChart data={salesStats?.byBanco || []} />
          </div>
        </AnimatedSection>
      </div>

      {/* Second Row: Seguradora + Ticket Médio + Taxa de Crescimento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Produção por Seguradora */}
        <AnimatedSection delay={0.15}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Produção por Seguradora</h3>
              <div className="chart-legend">
                <span className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ backgroundColor: '#8B5CF6' }} />
                  Operações
                </span>
              </div>
            </div>
            <SeguradoraChart data={salesStats?.bySeguradora || []} />
          </div>
        </AnimatedSection>

        {/* Ticket Médio por Banco */}
        <AnimatedSection delay={0.2}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Ticket Médio por Banco</h3>
              <div className="chart-legend">
                <span className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ backgroundColor: '#F97316' }} />
                  Média
                </span>
              </div>
            </div>
            <TicketMedioChart
              data={salesStats?.byBanco || []}
              globalAverage={salesStats?.averageValue}
            />
          </div>
        </AnimatedSection>

        {/* Taxa de Crescimento */}
        <AnimatedSection delay={0.25}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Taxa de Crescimento</h3>
            </div>
            <GrowthRateChart data={salesStats?.growthRates || []} />
          </div>
        </AnimatedSection>
      </div>

      {/* Third Row: Performance Colaboradores + Distribuição de Valores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Performance por Colaborador */}
        <AnimatedSection delay={0.3}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Performance por Colaborador</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Top 5
              </span>
            </div>
            <ColaboradorPerformanceChart data={salesStats?.byUser || []} />
          </div>
        </AnimatedSection>

        {/* Distribuição de Valores */}
        <AnimatedSection delay={0.35}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Distribuição de Valores</h3>
              <div className="chart-legend">
                <span className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ backgroundColor: '#10B981' }} />
                  Operações
                </span>
              </div>
            </div>
            <ValueDistributionChart data={salesStats?.valueRanges || []} />
          </div>
        </AnimatedSection>
      </div>

      {/* Fourth Row: Análise por Distrito + Últimas Submissões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Análise por Distrito - Donut Chart */}
        <AnimatedSection delay={0.4}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Distribuição por Distrito</h3>
            </div>
            <VisitorAnalysisChart data={salesStats?.byDistrito || []} />
          </div>
        </AnimatedSection>

        {/* Tabela de Últimas Submissões */}
        <AnimatedSection className="lg:col-span-2" delay={0.45}>
          <EmployeeTaskTable submissions={recentSubmissions} />
        </AnimatedSection>
      </div>
    </div>
  );
}
