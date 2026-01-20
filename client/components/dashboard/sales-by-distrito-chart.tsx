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

interface SalesByDistritoChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

export function SalesByDistritoChart({ data }: SalesByDistritoChartProps) {
  const chartData = data.map((item) => ({
    name: item.name || 'Não especificado',
    'Número de Vendas': item.count,
    'Valor Total (€)': Math.round(item.totalValue),
  }));

  const totalVendas = data.reduce((sum, item) => sum + item.count, 0);
  const totalValor = data.reduce((sum, item) => sum + item.totalValue, 0);
  const topDistrito = data[0];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total de Vendas</p>
          <p className="text-2xl font-bold text-foreground">
            {totalValor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalVendas} vendas
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Top Distrito</p>
          <p className="text-sm font-medium text-foreground">
            {topDistrito?.name || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            {topDistrito?.totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }) || 'N/A'}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData.slice(0, 6)}
          margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#6B7280"
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '11px' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
            formatter={(value, name) => {
              if (value == null) return '-';
              if (name === 'Valor Total (€)') {
                return `${Number(value).toLocaleString('pt-PT')} €`;
              }
              return value;
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="square" />
          <Bar
            dataKey="Número de Vendas"
            fill="#16A34A"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="Valor Total (€)"
            fill="#16CBC7"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
