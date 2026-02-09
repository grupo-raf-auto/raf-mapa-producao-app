import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { chartColors } from '@/lib/design-system';

interface TicketMedioChartProps {
  data: {
    name: string;
    count: number;
    totalValue: number;
    averageValue?: number;
  }[];
  globalAverage?: number;
}

const COLORS = [...chartColors.scale];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const avgValue = payload[0]?.value ?? 0;
  const count = payload[0]?.payload?.count;
  const fullName = payload[0]?.payload?.fullName ?? label;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-sm font-semibold text-foreground">{fullName}</p>
      <dl className="mt-1.5 space-y-1">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-xs text-muted-foreground">Valor médio</dt>
          <dd className="text-xs font-medium tabular-nums text-foreground">
            {avgValue.toLocaleString('pt-PT', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
            })}
          </dd>
        </div>
        {count != null && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Operações</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {count.toLocaleString('pt-PT')}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
};

export function TicketMedioChart({
  data,
  globalAverage,
}: TicketMedioChartProps) {
  const maxLabelLen = 14;
  const chartData =
    data.length > 0
      ? data.slice(0, 6).map((item, index) => ({
          name:
            item.name.length > maxLabelLen
              ? item.name.slice(0, maxLabelLen).trim() + '…'
              : item.name,
          fullName: item.name,
          averageValue: Math.round(
            item.averageValue ||
              (item.count > 0 ? item.totalValue / item.count : 0),
          ),
          count: item.count,
          color: COLORS[index % COLORS.length],
        }))
      : [];

  const avgLine =
    globalAverage ||
    (chartData.length > 0
      ? Math.round(
          chartData.reduce((sum, item) => sum + item.averageValue, 0) /
            chartData.length,
        )
      : 0);

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 12, left: 8, bottom: 24 }}
          barCategoryGap="20%"
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
            width={36}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
          />
          {avgLine > 0 && (
            <ReferenceLine
              y={avgLine}
              stroke={chartColors.primary}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: `Média: ${(avgLine / 1000).toFixed(0)}k`,
                position: 'right',
                fill: chartColors.primary,
                fontSize: 10,
              }}
            />
          )}
          <Bar dataKey="averageValue" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
