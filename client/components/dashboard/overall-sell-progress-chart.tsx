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
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-sm font-semibold text-foreground">{label}</p>
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
  // Transform data or use default
  const chartData =
    data.length > 0
      ? data.slice(0, 7).map((item) => ({
          name:
            item.name.length > 8
              ? item.name.substring(0, 8) + '...'
              : item.name,
          Quantidade: item.count,
          'Valor (k€)': Math.round(item.totalValue / 1000),
        }))
      : [
          { name: 'CGD', Quantidade: 0, 'Valor (k€)': 0 },
          { name: 'BPI', Quantidade: 0, 'Valor (k€)': 0 },
          { name: 'Santander', Quantidade: 0, 'Valor (k€)': 0 },
          { name: 'Millennium', Quantidade: 0, 'Valor (k€)': 0 },
          { name: 'Novobanco', Quantidade: 0, 'Valor (k€)': 0 },
        ];

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
            dx={-5}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
          />

          <Bar
            dataKey="Quantidade"
            fill={chartColors.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />

          <Bar
            dataKey="Valor (k€)"
            fill={chartColors.secondary}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
