'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { chartColors } from '@/lib/design-system';

const data = [
  { name: 'Jan', value: 45 },
  { name: 'Fev', value: 52 },
  { name: 'Mar', value: 48 },
  { name: 'Abr', value: 61 },
  { name: 'Mai', value: 55 },
  { name: 'Jun', value: 67 },
];

export function ActivityChart() {
  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  const change = previous
    ? (((current.value - previous.value) / previous.value) * 100).toFixed(1)
    : '0.0';
  const avgValue = Math.round(
    data.reduce((sum, item) => sum + item.value, 0) / data.length,
  );

  return (
    <div className="space-y-4">
      {/* KPI Principal */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Atividade Atual</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">
          {current.value}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <p
            className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-success' : 'text-destructive'}`}
          >
            {parseFloat(change) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(change))}
            %
          </p>
          <p className="text-xs text-muted-foreground">
            vs {previous?.name || 'anterior'}
          </p>
        </div>
      </div>

      {/* Gráfico Simplificado */}
      <div className="w-full h-[200px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
        >
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: -5, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartColors.grid}
              vertical={false}
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              stroke={chartColors.axis}
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={chartColors.axis}
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const value = payload[0]?.value;
                return (
                  <ChartTooltip
                    title={String(label ?? '')}
                    rows={[
                      {
                        label: 'Valor',
                        value:
                          value != null
                            ? Number(value).toLocaleString('pt-PT')
                            : '—',
                      },
                    ]}
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: chartColors.primary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
