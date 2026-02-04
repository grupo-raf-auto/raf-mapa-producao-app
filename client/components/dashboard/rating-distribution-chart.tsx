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

const COLORS = [...chartColors.scale];

interface RatingDistributionChartProps {
  data: { rating: string; count: number; totalValue: number }[];
}

export function RatingDistributionChart({
  data,
}: RatingDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de rating
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    rating: item.rating,
    count: item.count,
    totalValue: item.totalValue,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const rating = payload[0].payload?.rating;
    const count = payload[0].value;
    const totalValue = payload[0].payload?.totalValue;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
        <p className="text-sm font-semibold text-foreground">
          Rating {rating ?? '—'}
        </p>
        <dl className="mt-1.5 space-y-1">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Clientes</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {count != null ? count.toLocaleString('pt-PT') : '—'}
            </dd>
          </div>
          {totalValue != null && (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-muted-foreground">Valor total</dt>
              <dd className="text-xs font-medium tabular-nums text-foreground">
                {totalValue.toLocaleString('pt-PT', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                })}
              </dd>
            </div>
          )}
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
            dataKey="rating"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
