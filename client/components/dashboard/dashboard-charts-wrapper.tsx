"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TimeFilter, TimeFilterType } from "./time-filter";
import { DashboardStatusChart } from "./dashboard-status-chart";
import { OverallSellProgressChart } from "./overall-sell-progress-chart";
import { VisitorAnalysisChart } from "./visitor-analysis-chart";
import { EmployeeTaskTable } from "./employee-task-table";
import { SeguradoraChart } from "./seguradora-chart";
import { TicketMedioChart } from "./ticket-medio-chart";
import { ColaboradorPerformanceChart } from "./colaborador-performance-chart";
import { ValueDistributionChart } from "./value-distribution-chart";
import { GrowthRateChart } from "./growth-rate-chart";
import { TemplateCompositionChart } from "./template-composition-chart";
import { AgentePerformanceChart } from "./agente-performance-chart";
import { RatingDistributionChart } from "./rating-distribution-chart";
import { TicketMedioAgenteChart } from "./ticket-medio-agente-chart";
import { ColaboradorScatterChart } from "./colaborador-scatter-chart";

interface Submission {
  id: string;
  templateId: string;
  template?: { name: string };
  answers: {
    questionId: string;
    question?: { text: string };
    answer: string;
  }[];
  createdAt: string;
  user?: { name: string; email: string };
}

interface DashboardChartsWrapperProps {
  salesStats: {
    byMonth?: { month: string; count: number; totalValue: number }[];
    byBanco?: {
      name: string;
      count: number;
      totalValue: number;
      averageValue?: number;
    }[];
    bySeguradora?: {
      name: string;
      count: number;
      totalValue: number;
      averageValue?: number;
    }[];
    byDistrito?: { name: string; count: number; totalValue: number }[];
    byUser?: {
      userId: string;
      name: string;
      count: number;
      totalValue: number;
      averageValue?: number;
    }[];
    byTemplate?: { name: string; count: number; totalValue: number }[];
    byAgente?: {
      name: string;
      count: number;
      totalValue: number;
      averageValue?: number;
    }[];
    byRating?: { rating: string; count: number; totalValue: number }[];
    valueRanges?: { range: string; count: number }[];
    growthRates?: {
      month: string;
      growthRate: number;
      previousValue: number;
      currentValue: number;
    }[];
    averageValue?: number;
  } | null;
  recentSubmissions?: Submission[];
}

// Filter data by time period
function filterDataByPeriod(
  data: { month: string; count: number; totalValue: number }[],
  period: TimeFilterType,
): { month: string; count: number; totalValue: number }[] {
  if (!data || data.length === 0) return [];

  switch (period) {
    case "monthly":
      return data;

    case "quarterly": {
      const quarters: Record<string, { month: string; count: number; totalValue: number }> = {};
      data.forEach((item) => {
        const [year, month] = item.month.split("-");
        const quarter = Math.ceil(parseInt(month) / 3);
        const key = `${year}-Q${quarter}`;
        if (!quarters[key]) {
          quarters[key] = { month: key, count: 0, totalValue: 0 };
        }
        quarters[key].count += item.count;
        quarters[key].totalValue += item.totalValue;
      });
      return Object.values(quarters).sort((a, b) => a.month.localeCompare(b.month));
    }

    case "yearly": {
      const years: Record<string, { month: string; count: number; totalValue: number }> = {};
      data.forEach((item) => {
        const year = item.month.split("-")[0];
        if (!years[year]) {
          years[year] = { month: year, count: 0, totalValue: 0 };
        }
        years[year].count += item.count;
        years[year].totalValue += item.totalValue;
      });
      return Object.values(years).sort((a, b) => a.month.localeCompare(b.month));
    }

    case "last12months": {
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      return data
        .filter((item) => {
          const [year, month] = item.month.split("-");
          const itemDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          return itemDate >= twelveMonthsAgo;
        })
        .slice(-12);
    }

    default:
      return data;
  }
}

// Animation component wrapper
function AnimatedSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function DashboardChartsWrapper({
  salesStats,
  recentSubmissions = [],
}: DashboardChartsWrapperProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("monthly");

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
                    <span
                      className="chart-legend-dot"
                      style={{ backgroundColor: "#E14840" }}
                    />
                    Submissões
                  </span>
                  <span className="chart-legend-item">
                    <span
                      className="chart-legend-dot"
                      style={{ backgroundColor: "#C43A32" }}
                    />
                    Valor Total
                  </span>
                </div>
              </div>
              <TimeFilter value={timeFilter} onChange={setTimeFilter} />
            </div>
            <DashboardStatusChart
              data={filteredTimelineData}
              timeFilter={timeFilter}
            />
          </div>
        </AnimatedSection>

        {/* Produção por Banco - Vertical Bar Chart */}
        <AnimatedSection delay={0.1}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Produção por Banco</h3>
              <div className="chart-legend">
                <span className="chart-legend-item">
                  <span
                    className="chart-legend-dot"
                    style={{ backgroundColor: "#E14840" }}
                  />
                  Quantidade
                </span>
                <span className="chart-legend-item">
                  <span
                    className="chart-legend-dot"
                    style={{ backgroundColor: "#C43A32" }}
                  />
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
                  <span
                    className="chart-legend-dot"
                    style={{ backgroundColor: "#E14840" }}
                  />
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
                  <span
                    className="chart-legend-dot"
                    style={{ backgroundColor: "#E14840" }}
                  />
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
                  <span
                    className="chart-legend-dot"
                    style={{ backgroundColor: "#E14840" }}
                  />
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

      {/* Fifth Row: Template Composition + Agente Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AnimatedSection delay={0.5}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Composição por Tipo</h3>
            </div>
            <TemplateCompositionChart data={salesStats?.byTemplate || []} />
          </div>
        </AnimatedSection>

        <AnimatedSection className="lg:col-span-2" delay={0.55}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Performance por Agente</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Top 10
              </span>
            </div>
            <AgentePerformanceChart
              data={salesStats?.byAgente || []}
              globalAverage={salesStats?.averageValue}
            />
          </div>
        </AnimatedSection>
      </div>

      {/* Sixth Row: Rating + Ticket Médio Agente + Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AnimatedSection delay={0.6}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Distribuição de Rating</h3>
            </div>
            <RatingDistributionChart data={salesStats?.byRating || []} />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.65}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Ticket Médio por Agente</h3>
            </div>
            <TicketMedioAgenteChart
              data={salesStats?.byAgente || []}
              globalAverage={salesStats?.averageValue}
            />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.7}>
          <div className="chart-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="chart-card-title">Quantidade vs Valor</h3>
            </div>
            <ColaboradorScatterChart data={salesStats?.byUser || []} />
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
