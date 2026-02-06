'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { TimeFilterType } from './time-filter';
import { chartColors } from '@/lib/design-system';

const DEFAULT_VISIBLE_POINTS = 12;
const MIN_VISIBLE_POINTS = 3;

interface DashboardStatusChartProps {
  data: { month: string; count: number; totalValue: number }[];
  timeFilter?: TimeFilterType;
  showOnlyCount?: boolean;
  /** Label para a série de contagem no tooltip (ex. "Submissões" para crédito/imobiliária, "Apólices" para seguros) */
  countLabel?: string;
}

const monthNames = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function formatXAxisLabel(
  monthKey: string,
  timeFilter: TimeFilterType,
): string {
  if (monthKey.includes('-Q')) return monthKey;
  if (monthKey.includes('-W')) return monthKey;
  if (!monthKey.includes('-') || monthKey.length === 4) return monthKey;
  // Formato diário: "4 Fev 2025" (dia da apólice + mês + ano)
  if (timeFilter === 'daily') {
    const parts = monthKey.split('-');
    const [year, month, day] = parts;
    if (day && month) {
      const monthName = monthNames[parseInt(month, 10) - 1] || month;
      return `${parseInt(day, 10)} ${monthName}${year ? ` ${year}` : ''}`;
    }
  }
  const [year, month] = monthKey.split('-');
  const monthName = monthNames[parseInt(month, 10) - 1] || month;
  if (timeFilter === 'yearly') return year;
  // Mensal: "Fev 2025" (mais informação que só "Fev")
  return year ? `${monthName} ${year}` : monthName;
}

function getDefaultRange(length: number) {
  if (length <= 0) return { startIndex: 0, endIndex: 0 };
  if (length <= DEFAULT_VISIBLE_POINTS)
    return { startIndex: 0, endIndex: length - 1 };
  return { startIndex: length - DEFAULT_VISIBLE_POINTS, endIndex: length - 1 };
}

const DEFAULT_TOOLTIP_LABELS: Record<string, string> = {
  Apólices: 'Operações',
  'Valor (€)': 'Valor (mil €)',
};

function CustomTooltip({
  active,
  payload,
  label,
  labelFormatter,
  countLabel,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  labelFormatter?: (key: string) => string;
  countLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter && label ? labelFormatter(label) : label;
  const tooltipLabels = { ...DEFAULT_TOOLTIP_LABELS };
  if (countLabel) tooltipLabels['Apólices'] = countLabel;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-sm font-semibold text-foreground">{displayLabel}</p>
      <dl className="mt-1.5 space-y-1">
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-xs text-muted-foreground">
              {tooltipLabels[entry.name] ?? entry.name}
            </dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {entry.value != null ? entry.value.toLocaleString('pt-PT') : '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DashboardStatusChart({
  data,
  timeFilter = 'monthly',
  showOnlyCount = false,
  countLabel,
}: DashboardStatusChartProps) {
  // periodKey = chave única (ex. 2025-02, 2026-02); monthLabel = texto para eixo (Fev, Fev com ano se necessário)
  const chartData = useMemo(
    () =>
      data.length > 0
        ? data.map((item) => ({
            periodKey: item.month,
            monthLabel: formatXAxisLabel(item.month, timeFilter),
            Apólices: item.count,
            'Valor (€)': Math.round(item.totalValue / 100),
          }))
        : [],
    [data, timeFilter],
  );

  const defaultRange = useMemo(
    () => getDefaultRange(chartData.length),
    [chartData.length],
  );

  const [brushRange, setBrushRange] = useState(defaultRange);

  useEffect(() => {
    setBrushRange(defaultRange);
  }, [defaultRange.startIndex, defaultRange.endIndex]);

  const rangeStart = Math.max(
    0,
    Math.min(brushRange.startIndex, chartData.length - 1),
  );
  const rangeEnd =
    chartData.length > 0
      ? Math.min(
          chartData.length - 1,
          Math.max(rangeStart, brushRange.endIndex),
        )
      : 0;
  const visibleData = chartData.slice(rangeStart, rangeEnd + 1);

  const handleBrushChange = useCallback(
    (newState: { startIndex?: number; endIndex?: number } | null) => {
      if (newState?.startIndex != null && newState?.endIndex != null) {
        setBrushRange({
          startIndex: newState.startIndex,
          endIndex: newState.endIndex,
        });
      }
    },
    [],
  );

  const zoomIn = useCallback(() => {
    const span = rangeEnd - rangeStart + 1;
    const newSpan = Math.max(MIN_VISIBLE_POINTS, Math.floor(span * 0.6));
    const mid = rangeStart + (span - 1) / 2;
    const newStart = Math.max(0, Math.floor(mid - (newSpan - 1) / 2));
    const newEnd = Math.min(chartData.length - 1, newStart + newSpan - 1);
    const clampedStart = Math.max(0, newEnd - newSpan + 1);
    setBrushRange({ startIndex: clampedStart, endIndex: newEnd });
  }, [rangeStart, rangeEnd, chartData.length]);

  const zoomOut = useCallback(() => {
    const span = rangeEnd - rangeStart + 1;
    const newSpan = Math.min(chartData.length, Math.ceil(span * 1.5));
    const mid = rangeStart + (span - 1) / 2;
    const newStart = Math.max(0, Math.floor(mid - (newSpan - 1) / 2));
    const newEnd = Math.min(chartData.length - 1, newStart + newSpan - 1);
    const clampedEnd = Math.min(chartData.length - 1, newStart + newSpan - 1);
    const clampedStart = Math.max(0, clampedEnd - newSpan + 1);
    setBrushRange({ startIndex: clampedStart, endIndex: clampedEnd });
  }, [rangeStart, rangeEnd, chartData.length]);

  const resetZoom = useCallback(() => {
    setBrushRange(getDefaultRange(chartData.length));
  }, [chartData.length]);

  const maxValue =
    visibleData.length > 0
      ? Math.max(...visibleData.map((d) => d['Apólices']), 1)
      : 1;
  const yAxisMax = Math.ceil(maxValue * 1.2);

  const showZoom = chartData.length > MIN_VISIBLE_POINTS;
  const showBrush = chartData.length > 6;

  const labelFormatter = useCallback(
    (periodKey: string) => formatXAxisLabel(periodKey, timeFilter),
    [timeFilter],
  );

  return (
    <div className="w-full flex flex-col gap-2">
      {chartData.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm rounded border border-border/50 bg-muted/20">
          Sem dados para o período selecionado
        </div>
      ) : (
        <>
          {showZoom && (
            <div className="flex items-center justify-end gap-1">
              <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={zoomIn}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={zoomOut}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Reduzir zoom"
                  aria-label="Reduzir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Repor escala"
                  aria-label="Repor escala"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="h-[260px] relative bg-white rounded">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 16,
                  right: 24,
                  left: 8,
                  bottom: showBrush ? 8 : 4,
                }}
              >
                {/* Apenas grelha horizontal, fina e discreta (estilo referência) */}
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={chartColors.grid}
                  vertical={false}
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="periodKey"
                  tickFormatter={(value) => formatXAxisLabel(value, timeFilter)}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.axis, fontSize: 12 }}
                  dy={8}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.axis, fontSize: 12 }}
                  dx={-4}
                  allowDecimals={false}
                  domain={[0, yAxisMax]}
                  width={32}
                />
                <Tooltip
                  content={(props) => (
                    <CustomTooltip
                      {...props}
                      labelFormatter={labelFormatter}
                      countLabel={countLabel}
                    />
                  )}
                  cursor={{ stroke: chartColors.axis, strokeWidth: 1 }}
                />
                {!showOnlyCount && (
                  <Line
                    type="monotone"
                    dataKey="Valor (€)"
                    stroke={chartColors.secondary}
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="Apólices"
                  stroke={chartColors.primary}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                />
                {showBrush && (
                  <Brush
                    dataKey="periodKey"
                    height={28}
                    stroke={chartColors.axis}
                    fill="rgba(100,116,139,0.08)"
                    travellerWidth={6}
                    onChange={handleBrushChange}
                    startIndex={rangeStart}
                    endIndex={rangeEnd}
                    tickFormatter={(value) =>
                      formatXAxisLabel(value, timeFilter)
                    }
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
