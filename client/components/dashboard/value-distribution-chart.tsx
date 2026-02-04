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

interface ValueDistributionChartProps {
  data: { range: string; count: number }[];
}

const COLORS = [...chartColors.scale];

const RANGE_LABELS: Record<string, string> = {
  '0-50k': '0-50k',
  '50k-100k': '50-100k',
  '100k-200k': '100-200k',
  '200k-500k': '200-500k',
  '500k+': '500k+',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <dl className="mt-1.5 space-y-1">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-xs text-muted-foreground">Operações</dt>
          <dd className="text-xs font-medium tabular-nums text-foreground">
            {value != null ? value.toLocaleString('pt-PT') : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
};

export function ValueDistributionChart({ data }: ValueDistributionChartProps) {
  const chartData =
    data.length > 0
      ? data.map((item, index) => ({
          range: RANGE_LABELS[item.range] || item.range,
          count: item.count,
          color: COLORS[index % COLORS.length],
        }))
      : [
          { range: '0-50k', count: 0, color: COLORS[0] },
          { range: '50-100k', count: 0, color: COLORS[1] },
          { range: '100-200k', count: 0, color: COLORS[2] },
          { range: '200-500k', count: 0, color: COLORS[3] },
          { range: '500k+', count: 0, color: COLORS[4] },
        ];

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="range"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
            dy={10}
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
        <span>
          Total: <span className="font-medium text-foreground">{total}</span>{' '}
          operacoes
        </span>
        {total > 0 && chartData.length > 0 && (
          <span>
            Maior concentracao:{' '}
            <span className="font-medium text-emerald-600">
              {
                chartData.reduce(
                  (max, item) => (item.count > max.count ? item : max),
                  chartData[0],
                ).range
              }
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
