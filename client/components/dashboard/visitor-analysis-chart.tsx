'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { chartColors } from '@/lib/design-system';

interface VisitorAnalysisChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

const COLORS = [...chartColors.scale];

export function VisitorAnalysisChart({ data }: VisitorAnalysisChartProps) {
  const chartData =
    data.length > 0
      ? data.slice(0, 5).map((item, index) => ({
          name: item.name || 'Unknown',
          value: item.count,
          color: COLORS[index % COLORS.length],
        }))
      : [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-row w-full min-h-0 gap-4 items-center">
        <div className="relative shrink-0 w-[200px] h-[200px] flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            0
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
            Submissões
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Sem dados de distrito</p>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-full min-h-0 gap-4 items-center">
      {/* Donut Chart — mesmo padrão do Fracionamento: centro com total, legenda ao lado */}
      <div className="relative shrink-0 w-[200px] h-[200px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {total.toLocaleString('pt-PT')}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
            Submissões
          </span>
        </div>

        <div className="relative z-10 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={1.5}
                stroke="var(--card)"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 100 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const name = payload[0].name;
                  const value = payload[0].value;
                  const pct =
                    total > 0
                      ? ((Number(value) / total) * 100).toFixed(0)
                      : '0';
                  return (
                    <ChartTooltip
                      title={String(name ?? '')}
                      rows={[
                        {
                          label: 'Operações',
                          value:
                            value != null
                              ? Number(value).toLocaleString('pt-PT')
                              : '—',
                        },
                        { label: '% do total', value: `${pct}%` },
                      ]}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legenda — à direita do donut (mesmo padrão do Fracionamento) */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-2 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="shrink-0 w-2 h-2 rounded-full ring-1 ring-border/50"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {item.name}
              </span>
            </div>
            <span className="text-xs font-medium tabular-nums text-foreground shrink-0">
              {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
