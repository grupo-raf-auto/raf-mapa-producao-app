import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardStatusChart } from './dashboard-status-chart';
import { OverallSellProgressChart } from './overall-sell-progress-chart';
import { VisitorAnalysisChart } from './visitor-analysis-chart';
import { SeguradoraChart } from './seguradora-chart';
import { TicketMedioChart } from './ticket-medio-chart';
import { ColaboradorPerformanceChart } from './colaborador-performance-chart';
import { GrowthRateChart } from './growth-rate-chart';
import { AgentePerformanceChart } from './agente-performance-chart';
import { RatingDistributionChart } from './rating-distribution-chart';
import { TicketMedioAgenteChart } from './ticket-medio-agente-chart';
import { FracionamentoChart } from './fracionamento-chart';
import { useModelContext } from '@/contexts/model-context';

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
    byFracionamento?: {
      fracionamento: string;
      count: number;
      totalValue: number;
    }[];
    valueRanges?: { range: string; count: number }[];
    growthRates?: {
      month: string;
      growthRate: number;
      previousValue: number;
      currentValue: number;
    }[];
    averageValue?: number;
  } | null;
  comparativeStats?: {
    byUser?: {
      userId: string;
      name: string;
      count: number;
      totalValue: number;
      averageValue?: number;
    }[];
    byAgente?: {
      name: string;
      count: number;
      totalValue: number;
      averageValue?: number;
    }[];
  } | null;
  recentSubmissions?: Submission[];
}

// Removed filterDataByPeriod - now handled by backend

// Animation component wrapper
function AnimatedSection({
  children,
  delay = 0,
  className = '',
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
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

export function DashboardChartsWrapper({
  salesStats,
  comparativeStats,
  recentSubmissions = [],
}: DashboardChartsWrapperProps) {
  const { activeModel } = useModelContext();

  const isSeguroModel = activeModel?.modelType === 'seguro';
  const isCreditoOuImobiliaria =
    activeModel?.modelType === 'credito' ||
    activeModel?.modelType === 'imobiliaria';

  // Labels por contexto: crédito/imobiliária = submissões e data do registo; seguros = apólices
  const countLegendLabel = isCreditoOuImobiliaria ? 'Submissões' : 'Apólices';
  const timeLegendSuffix = isCreditoOuImobiliaria
    ? 'Por dia (data do registo)'
    : 'Por dia (data da apólice)';
  const countChartLabel = isCreditoOuImobiliaria ? 'Submissões' : undefined;
  const countUnit = isCreditoOuImobiliaria
    ? { singular: 'submissão', plural: 'submissões' }
    : undefined;
  const fracionamentoCenterLabel = isCreditoOuImobiliaria
    ? 'Operações'
    : 'Apólices';

  const timelineData = salesStats?.byMonth || [];

  // Anos presentes nos dados (ex.: "2025-02-04" -> 2025)
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    timelineData.forEach((item) => {
      const y = item.month.slice(0, 4);
      if (/^\d{4}$/.test(y)) years.add(parseInt(y, 10));
    });
    const arr = Array.from(years).sort((a, b) => b - a);
    return arr.length > 0 ? arr : [new Date().getFullYear()];
  }, [timelineData]);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(() =>
    String(availableYears[0] ?? currentYear),
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const filteredTimelineData = useMemo(() => {
    const year = selectedYear || String(currentYear);
    if (!selectedMonth || selectedMonth === 'all') {
      return timelineData.filter((item) => item.month.startsWith(year));
    }
    const monthPad = selectedMonth.padStart(2, '0');
    const prefix = `${year}-${monthPad}`;
    return timelineData.filter(
      (item) => item.month === prefix || item.month.startsWith(prefix + '-'),
    );
  }, [timelineData, selectedYear, selectedMonth, currentYear]);

  const monthOptions = [
    { value: 'all', label: 'Todos os meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  // Use comparative stats for comparison charts (all users), personal stats for individual charts
  const userDataForComparison =
    comparativeStats?.byUser || salesStats?.byUser || [];
  const agenteDataForComparison =
    comparativeStats?.byAgente || salesStats?.byAgente || [];

  // Layout específico para dashboard de Seguros
  if (isSeguroModel) {
    return (
      <div
        className="space-y-5"
        role="region"
        aria-label="Dashboard de seguros — gráficos e métricas"
      >
        {/* Row 1: Evolução das Apólices (3 col, full width) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatedSection className="md:col-span-2 lg:col-span-3" delay={0}>
            <div className="chart-card h-full relative">
              <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="chart-card-title">Evolução das Apólices</h3>
                  <div className="chart-legend mt-2 flex items-center gap-3 flex-wrap">
                    <span className="chart-legend-item">
                      <span className="chart-legend-dot bg-[var(--chart-1)]" />
                      Apólices
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Por dia (data da apólice)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="min-w-[11rem] w-auto max-w-[200px] h-8 text-xs">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DashboardStatusChart
                data={filteredTimelineData}
                timeFilter="daily"
                showOnlyCount
              />
            </div>
          </AnimatedSection>
        </div>

        {/* Row 2: Apólices por Seguradora + Taxa de Crescimento (3 col) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatedSection className="md:col-span-2 lg:col-span-2" delay={0.1}>
            <div className="chart-card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Apólices por Seguradora</h3>
                <div className="chart-legend">
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot bg-[var(--chart-1)]" />
                    Apólices
                  </span>
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot bg-[var(--chart-2)]" />
                    Valor
                  </span>
                </div>
              </div>
              <OverallSellProgressChart data={salesStats?.bySeguradora || []} />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="chart-card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Taxa de Crescimento</h3>
              </div>
              <GrowthRateChart data={salesStats?.growthRates || []} />
            </div>
          </AnimatedSection>
        </div>

        {/* Row 3: Performance por Colaborador (1 col) + Valor Médio por Agente (2 col) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatedSection delay={0.2}>
            <div className="chart-card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">
                  Performance por Colaborador
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Top 3
                </span>
              </div>
              <ColaboradorPerformanceChart
                data={userDataForComparison}
                rankByCount
              />
            </div>
          </AnimatedSection>
          <AnimatedSection className="md:col-span-2 lg:col-span-2" delay={0.25}>
            <div className="chart-card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Valor Médio por Agente</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Top 3
                </span>
              </div>
              <TicketMedioAgenteChart
                data={agenteDataForComparison.map((item) => ({
                  ...item,
                  averageValue: item.averageValue ?? 0,
                }))}
                globalAverage={salesStats?.averageValue}
              />
            </div>
          </AnimatedSection>
        </div>

        {/* Row 4: Rating de Clientes, Distribuição por Distrito, Distribuição por Fracionamento (3 col) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatedSection delay={0.35}>
            <div className="chart-card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Rating de Clientes</h3>
              </div>
              <RatingDistributionChart data={salesStats?.byRating || []} />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.4}>
            <div className="chart-card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Distribuição por Distrito</h3>
              </div>
              <VisitorAnalysisChart data={salesStats?.byDistrito || []} />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.45}>
            <div className="chart-card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">
                  Distribuição por Fracionamento
                </h3>
              </div>
              <FracionamentoChart data={salesStats?.byFracionamento || []} />
            </div>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  // Título de secção por tópico
  const SectionTitle = ({
    children,
    id,
  }: {
    children: React.ReactNode;
    id?: string;
  }) => (
    <h2
      id={id}
      className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-1 mt-6 first:mt-0"
    >
      {children}
    </h2>
  );

  // Layout Crédito e Imobiliária: agrupado por tópicos, grid 3 colunas
  return (
    <div
      className="space-y-5"
      role="region"
      aria-label={
        isCreditoOuImobiliaria
          ? 'Dashboard de produção — gráficos e métricas'
          : undefined
      }
    >
      {/* ——— 1. Evolução e tendência ——— */}
      <section aria-labelledby="topic-evolucao">
        <SectionTitle id="topic-evolucao">Evolução e tendência</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatedSection className="md:col-span-2 lg:col-span-2" delay={0}>
            <div className="chart-card h-full relative min-h-[320px]">
              <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="chart-card-title">Evolução da Produção</h3>
                  <div className="chart-legend mt-2 flex items-center gap-3 flex-wrap">
                    <span className="chart-legend-item">
                      <span className="chart-legend-dot bg-[var(--chart-1)]" />
                      {countLegendLabel}
                    </span>
                    <span className="chart-legend-item">
                      <span className="chart-legend-dot bg-[var(--chart-2)]" />
                      Valor Total
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {timeLegendSuffix}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="min-w-[11rem] w-auto max-w-[200px] h-8 text-xs">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DashboardStatusChart
                data={filteredTimelineData}
                timeFilter="daily"
                showOnlyCount={false}
                countLabel={countChartLabel}
              />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.05}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Taxa de Crescimento</h3>
              </div>
              <GrowthRateChart data={salesStats?.growthRates || []} />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ——— 2. Produção por entidade (3 col: 1 gráfico por coluna) ——— */}
      <section aria-labelledby="topic-entidade">
        <SectionTitle id="topic-entidade">Produção por entidade</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatedSection delay={0.1}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Produção por Banco</h3>
                <div className="chart-legend">
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot bg-[var(--chart-1)]" />
                    Quantidade
                  </span>
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot bg-[var(--chart-2)]" />
                    Valor
                  </span>
                </div>
              </div>
              <OverallSellProgressChart data={salesStats?.byBanco || []} />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Produção por Seguradora</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Operações
                </span>
              </div>
              <SeguradoraChart data={salesStats?.bySeguradora || []} />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Ticket Médio por Banco</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Média
                </span>
              </div>
              <TicketMedioChart
                data={salesStats?.byBanco || []}
                globalAverage={salesStats?.averageValue}
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ——— 3. Performance da equipa (3 col: 1 gráfico por coluna) ——— */}
      <section aria-labelledby="topic-performance">
        <SectionTitle id="topic-performance">
          Performance da equipa
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatedSection delay={0.25}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">
                  Performance por Colaborador
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Top 3
                </span>
              </div>
              <ColaboradorPerformanceChart
                data={userDataForComparison}
                countUnit={countUnit}
              />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <div className="chart-card h-full min-h-[320px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Performance por Agente</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Top 10
                </span>
              </div>
              <AgentePerformanceChart
                data={agenteDataForComparison.map((item) => ({
                  ...item,
                  averageValue: item.averageValue ?? 0,
                }))}
                globalAverage={salesStats?.averageValue}
              />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.35}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Ticket Médio por Agente</h3>
              </div>
              <TicketMedioAgenteChart
                data={agenteDataForComparison.map((item) => ({
                  ...item,
                  averageValue: item.averageValue ?? 0,
                }))}
                globalAverage={salesStats?.averageValue}
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ——— 4. Distribuição e perfil (3 col: 1 gráfico por coluna) ——— */}
      <section aria-labelledby="topic-distribuicao">
        <SectionTitle id="topic-distribuicao">
          Distribuição e perfil
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatedSection delay={0.4}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Distribuição por Distrito</h3>
              </div>
              <VisitorAnalysisChart data={salesStats?.byDistrito || []} />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.45}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Distribuição de Rating</h3>
              </div>
              <RatingDistributionChart data={salesStats?.byRating || []} />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.5}>
            <div className="chart-card h-full min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-card-title">Fracionamento</h3>
              </div>
              <FracionamentoChart
                data={salesStats?.byFracionamento || []}
                centerLabel={fracionamentoCenterLabel}
              />
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
