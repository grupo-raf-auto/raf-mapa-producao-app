import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { chartColors } from '@/lib/design-system';

const COLORS = [...chartColors.scale];

interface TemplateCompositionChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

export function TemplateCompositionChart({
  data,
}: TemplateCompositionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de templates
      </div>
    );
  }

  const totalSubmissions = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = data.map((item, index) => ({
    name: item.name
      .replace('Registo de Produção ', '')
      .replace('Registo de Vendas ', ''),
    value: item.count,
    percentage: ((item.count / totalSubmissions) * 100).toFixed(1),
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const name = payload[0].name;
    const value = payload[0].value;
    const percentage = payload[0].payload?.percentage;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <dl className="mt-1.5 space-y-1">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Submissões</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {value?.toLocaleString('pt-PT') ?? '—'}
            </dd>
          </div>
          {percentage != null && (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-muted-foreground">% do total</dt>
              <dd className="text-xs font-medium tabular-nums text-foreground">
                {percentage}%
              </dd>
            </div>
          )}
        </dl>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-xs">
                  {value} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2 text-sm text-muted-foreground">
        Total: {totalSubmissions.toLocaleString('pt-PT')} submissões
      </div>
    </div>
  );
}
