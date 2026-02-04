'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { chartColors } from '@/lib/design-system';

interface TicketMedioAgenteChartProps {
  data: { name: string; averageValue: number }[];
  globalAverage?: number;
}

export function TicketMedioAgenteChart({
  data,
  globalAverage = 0,
}: TicketMedioAgenteChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de ticket médio
      </div>
    );
  }

  const top3 = data.slice(0, 3);

  const chartData = top3.map((item) => ({
    name:
      item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
    value: item.averageValue,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const name = payload[0].payload?.name;
    const value = payload[0].value;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <dl className="mt-1.5 space-y-1">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Valor médio</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {value != null
                ? value.toLocaleString('pt-PT', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  })
                : '—'}
            </dd>
          </div>
        </dl>
      </div>
    );
  };

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 9 }}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
          />
          {globalAverage > 0 && (
            <ReferenceLine
              y={globalAverage}
              stroke={chartColors.primary}
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Média: ${(globalAverage / 1000).toFixed(0)}k`,
                position: 'right',
                fill: chartColors.primary,
                fontSize: 10,
              }}
            />
          )}
          <Bar
            dataKey="value"
            fill={chartColors.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
