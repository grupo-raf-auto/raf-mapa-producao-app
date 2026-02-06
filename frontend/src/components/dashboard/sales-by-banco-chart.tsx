'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { chartColors } from '@/lib/design-system';

interface SalesByBancoChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

export function SalesByBancoChart({ data }: SalesByBancoChartProps) {
  const chartData = data.map((item) => ({
    name: item.name || 'Não especificado',
    'Número de Vendas': item.count,
    'Valor Total (€)': Math.round(item.totalValue),
  }));

  const totalVendas = data.reduce((sum, item) => sum + item.count, 0);
  const totalValor = data.reduce((sum, item) => sum + item.totalValue, 0);
  const topBanco = data[0];

  return (
    <div className="space-y-4">
      {/* KPI Principal */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Total de Vendas</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">
          {totalValor.toLocaleString('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {totalVendas} transações
        </p>
      </div>

      {/* Gráfico Simplificado - Apenas Valor Total */}
      <div className="w-full h-[200px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
        >
          <BarChart
            data={chartData.slice(0, 6)}
            margin={{ top: 5, right: 5, left: -5, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartColors.grid}
              horizontal={false}
              opacity={0.5}
            />
            <XAxis
              type="number"
              stroke={chartColors.axis}
              style={{ fontSize: '11px' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={chartColors.axis}
              style={{ fontSize: '11px' }}
              width={70}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const totalValue = payload[0]?.value;
                const count = payload[0]?.payload?.['Número de Vendas'];
                const rows = [
                  {
                    label: 'Valor total',
                    value:
                      totalValue != null
                        ? Number(totalValue).toLocaleString('pt-PT', {
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
                return <ChartTooltip title={String(label ?? '')} rows={rows} />;
              }}
            />
            <Bar
              dataKey="Valor Total (€)"
              fill={chartColors.primary}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
