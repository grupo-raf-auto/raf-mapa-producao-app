'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { chartColors } from '@/lib/design-system';

interface AgentePerformanceChartProps {
  data: {
    name: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }[];
  globalAverage?: number;
}

export function AgentePerformanceChart({
  data,
  globalAverage = 0,
}: AgentePerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de agentes
      </div>
    );
  }

  const top10 = data.slice(0, 10);

  const chartData = top10.map((item) => {
    let color = chartColors.redScale[2];
    if (item.averageValue > globalAverage * 1.1) {
      color = chartColors.primary;
    } else if (item.averageValue < globalAverage * 0.9) {
      color = chartColors.redScale[3];
    }

    return {
      name:
        item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      totalValue: item.totalValue,
      count: item.count,
      averageValue: item.averageValue,
      color,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
        <p className="text-sm font-semibold text-foreground">{p.name}</p>
        <dl className="mt-1.5 space-y-1">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Valor total</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {payload[0].value?.toLocaleString('pt-PT', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }) ?? '—'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Operações</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {p.count != null ? p.count.toLocaleString('pt-PT') : '—'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Valor médio</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {p.averageValue?.toLocaleString('pt-PT', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }) ?? '—'}
            </dd>
          </div>
        </dl>
      </div>
    );
  };

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
            width={120}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
          />
          <Bar dataKey="totalValue" radius={[0, 4, 4, 0]} maxBarSize={30}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
