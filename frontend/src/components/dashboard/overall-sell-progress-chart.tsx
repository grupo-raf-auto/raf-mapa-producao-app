'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { chartColors } from '@/lib/design-system';

interface OverallSellProgressChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

const TOOLTIP_LABELS: Record<string, string> = {
  Quantidade: 'Operações',
  'Valor (k€)': 'Valor (mil €)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName ?? label;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-sm font-semibold text-foreground">{fullName}</p>
      <dl className="mt-1.5 space-y-1">
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-xs text-muted-foreground">
              {TOOLTIP_LABELS[entry.name] ?? entry.name}
            </dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {entry.value != null ? entry.value.toLocaleString('pt-PT') : '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export function OverallSellProgressChart({
  data,
}: OverallSellProgressChartProps) {
  const maxLabelLen = 14;
  const chartData =
    data.length > 0
      ? data.slice(0, 7).map((item) => ({
          name:
            item.name.length > maxLabelLen
              ? item.name.slice(0, maxLabelLen).trim() + '…'
              : item.name,
          fullName: item.name,
          Quantidade: item.count,
          'Valor (k€)': Math.round(item.totalValue / 1000),
        }))
      : [];

  if (chartData.length === 0) {
    return (
      <div
        className="w-full h-[260px] flex items-center justify-center text-muted-foreground text-sm rounded border border-border/50 bg-muted/20"
        role="status"
        aria-label="Sem dados"
      >
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div
      className="w-full h-[260px]"
      role="img"
      aria-label="Gráfico de evolução"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 12, left: 8, bottom: 24 }}
          barCategoryGap="18%"
          barGap={6}
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
            dy={8}
            interval={0}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
            width={32}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
          />

          <Bar
            dataKey="Quantidade"
            fill={chartColors.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={26}
          />

          <Bar
            dataKey="Valor (k€)"
            fill={chartColors.secondary}
            radius={[4, 4, 0, 0]}
            maxBarSize={26}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
