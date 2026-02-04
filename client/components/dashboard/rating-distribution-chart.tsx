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
import { Star } from 'lucide-react';
import { chartColors } from '@/lib/design-system';

const COLORS = [...chartColors.scale];

interface RatingDistributionChartProps {
  data: { rating: string; count: number; totalValue: number }[];
}

/** Ordena ratings numericamente (2, 3, 4, 5) para eixo X legível */
function sortByRating(
  data: { rating: string; count: number; totalValue: number }[],
) {
  return [...data].sort((a, b) => {
    const na = Number(a.rating);
    const nb = Number(b.rating);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return 0;
    return na - nb;
  });
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

  const sorted = sortByRating(data);
  const maxCount = Math.max(...sorted.map((d) => d.count), 1);
  const yMax = Math.ceil(maxCount) || 1;
  const maxTicks = 7;
  const step = yMax <= maxTicks ? 1 : Math.ceil(yMax / maxTicks);
  const yTicks: number[] = [];
  for (let v = 0; v <= yMax; v += step) yTicks.push(v);
  if (yTicks[yTicks.length - 1] !== yMax) yTicks.push(yMax);

  const chartData = sorted.map((item, index) => ({
    rating: item.rating,
    count: item.count,
    totalValue: item.totalValue,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const rating = payload[0].payload?.rating;
    const color = payload[0].payload?.color;
    const count = payload[0].value;
    const totalValue = payload[0].payload?.totalValue;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Star
            className="size-3.5 shrink-0"
            style={{
              fill: color ?? 'currentColor',
              color: color ?? 'currentColor',
            }}
            aria-hidden
          />
          <span>{rating ?? '—'}</span>
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
    <div className="w-full">
      <div className="w-full h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke={chartColors.grid}
              vertical={false}
            />
            <XAxis
              dataKey="rating"
              axisLine={false}
              tickLine={false}
              tick={{ fill: chartColors.axis, fontSize: 11 }}
            />
            <YAxis
              domain={[0, yMax]}
              ticks={yTicks}
              allowDecimals={false}
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
      {/* Legenda: rating → cor */}
      <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5">
        {chartData.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Star
                className="size-3.5 shrink-0"
                style={{ fill: entry.color, color: entry.color }}
                aria-hidden
              />
              <span>{entry.rating}</span>
              <span className="font-medium tabular-nums text-foreground">
                ({entry.count})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
