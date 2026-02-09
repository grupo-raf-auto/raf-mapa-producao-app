import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { chartColors } from '@/lib/design-system';

const COLORS = [...chartColors.scale];

interface TicketMedioAgenteChartProps {
  data: { name: string; averageValue: number }[];
  globalAverage?: number;
}

/** Nome para o eixo: truncar só se muito longo, com limite maior para evitar "..." em nomes comuns */
function displayName(name: string, maxLen = 20) {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen).trim() + '…';
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

  const chartData = top3.map((item, index) => ({
    name: displayName(item.name),
    fullName: item.name,
    value: item.averageValue,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const fullName = payload[0].payload?.fullName ?? payload[0].payload?.name;
    const value = payload[0].value;
    const formatted =
      value != null
        ? value.toLocaleString('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
        : '—';
    return (
      <ChartTooltip
        title={fullName}
        rows={[{ label: 'Valor médio', value: formatted }]}
        className="shadow-lg z-100"
      />
    );
  };

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="0"
            stroke={chartColors.grid}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            height={56}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.axis, fontSize: 10 }}
            tickFormatter={(value) =>
              value === 0 ? '0' : `${Math.round(value / 1000)}k`
            }
            width={36}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
          />
          {globalAverage > 0 && (
            <ReferenceLine
              y={globalAverage}
              stroke={chartColors.axis}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Média ${(globalAverage / 1000).toFixed(0)}k`,
                position: 'right',
                fill: chartColors.axis,
                fontSize: 10,
              }}
            />
          )}
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
