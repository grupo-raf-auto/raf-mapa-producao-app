'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { chartColors } from '@/lib/design-system';

interface FracionamentoChartProps {
  data: { fracionamento: string; count: number; totalValue: number }[];
}

const COLORS = [...chartColors.redScale];

// Labels mais curtos para display
const LABEL_MAP: Record<string, string> = {
  Mensal: 'Mensal',
  Trimestral: 'Trimestral',
  Semestral: 'Semestral',
  Anual: 'Anual',
  'Não aplicável (para crédito)': 'N/A',
};

const defaultData = [
  { name: 'Mensal', value: 40, color: COLORS[0] },
  { name: 'Anual', value: 30, color: COLORS[1] },
  { name: 'Trimestral', value: 15, color: COLORS[2] },
  { name: 'Semestral', value: 10, color: COLORS[3] },
  { name: 'N/A', value: 5, color: COLORS[4] },
];

export function FracionamentoChart({ data }: FracionamentoChartProps) {
  // Transform data or use default
  const chartData =
    data.length > 0
      ? data.slice(0, 5).map((item, index) => ({
          name: LABEL_MAP[item.fracionamento] || item.fracionamento,
          value: item.count,
          totalValue: item.totalValue,
          color: COLORS[index % COLORS.length],
        }))
      : defaultData;

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col items-center">
      {/* Donut Chart */}
      <div className="relative w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const name = payload[0].name;
                const value = payload[0].value;
                const totalValue = payload[0].payload?.totalValue;
                const pct =
                  total > 0 ? ((Number(value) / total) * 100).toFixed(0) : '0';
                const rows = [
                  {
                    label: 'Apólices',
                    value:
                      value != null
                        ? Number(value).toLocaleString('pt-PT')
                        : '—',
                  },
                  { label: '% do total', value: `${pct}%` },
                ];
                if (totalValue != null) {
                  rows.push({
                    label: 'Valor total',
                    value: Number(totalValue).toLocaleString('pt-PT', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                    }),
                  });
                }
                return <ChartTooltip title={String(name ?? '')} rows={rows} />;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {total.toLocaleString('pt-PT')}
          </span>
          <span className="text-xs text-muted-foreground">Apólices</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full mt-4 space-y-2">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-foreground">
              {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
