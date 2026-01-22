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
      {/* KPI Principal */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Total de Vendas</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">
          {totalValor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {topDistrito?.name || 'N/A'}
        </p>
      </div>

      {/* Gráfico Simplificado - Apenas Valor Total */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData.slice(0, 5)}
          margin={{ top: 5, right: 5, left: -5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} opacity={0.5} />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            tickLine={false}
            axisLine={false}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => {
              if (value == null) return '-';
              return `${Number(value).toLocaleString('pt-PT')} €`;
            }}
            labelStyle={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}
          />
          <Bar
            dataKey="Valor Total (€)"
            fill="#5347CE"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
