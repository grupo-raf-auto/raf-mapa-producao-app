'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { chartColors } from '@/lib/design-system';

interface TopBancosPieChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

const COLORS = [...chartColors.scale];

export function TopBancosPieChart({ data }: TopBancosPieChartProps) {
  // Pegar top 8 bancos por valor
  const topBancos = data.slice(0, 8).map((item) => ({
    name: item.name || 'Não especificado',
    value: Math.round(item.totalValue),
    count: item.count,
  }));

  if (topBancos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }

  const totalValue = topBancos.reduce((sum, item) => sum + item.value, 0);
  const topBanco = topBancos[0];
  const topPercentage = Math.round((topBanco.value / totalValue) * 100);

  const totalVisits = topBancos.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      {/* KPI Principal */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Total de Vendas</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">
          {totalVisits.toLocaleString('pt-PT')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {topBancos.length} bancos
        </p>
      </div>

      {/* Donut Chart Simplificado */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-full h-[200px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
          >
            <PieChart>
              <Pie
                data={topBancos.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={50}
                outerRadius={80}
                fill={COLORS[0]}
                dataKey="value"
              >
                {topBancos.slice(0, 5).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const name = payload[0].name;
                  const value = payload[0].value;
                  const count = payload[0].payload?.count;
                  const rows = [
                    {
                      label: 'Valor total',
                      value:
                        value != null
                          ? Number(value).toLocaleString('pt-PT', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 0,
                            })
                          : '—',
                    },
                  ];
                  if (count != null) {
                    rows.push({
                      label: 'Operações',
                      value: Number(count).toLocaleString('pt-PT'),
                    });
                  }
                  return (
                    <ChartTooltip title={String(name ?? '')} rows={rows} />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
