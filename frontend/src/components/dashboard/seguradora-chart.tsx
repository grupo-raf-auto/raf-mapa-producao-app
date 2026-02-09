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

interface SeguradoraChartProps {
  data: {
    name: string;
    count: number;
    totalValue: number;
    averageValue?: number;
  }[];
}

const COLORS = [...chartColors.scale];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const count = payload[0]?.value;
  const totalValue = payload[0]?.payload?.totalValue;
  const fullName = payload[0]?.payload?.fullName ?? label;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-sm font-semibold text-foreground">{fullName}</p>
      <dl className="mt-1.5 space-y-1">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-xs text-muted-foreground">Operações</dt>
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

export function SeguradoraChart({ data }: SeguradoraChartProps) {
  const maxLabelLen = 16;
  const chartData =
    data.length > 0
      ? data.slice(0, 6).map((item, index) => ({
          name:
            item.name.length > maxLabelLen
              ? item.name.slice(0, maxLabelLen).trim() + '…'
              : item.name,
          fullName: item.name,
          count: item.count,
          totalValue: item.totalValue,
          color: COLORS[index % COLORS.length],
        }))
      : [];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm rounded border border-border/50 bg-muted/20">
        Sem dados de seguradora
      </div>
    );
  }

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
          barCategoryGap="24%"
        >
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
            width={92}
            tickMargin={8}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
