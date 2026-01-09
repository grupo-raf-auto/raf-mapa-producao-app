'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SalesByDistritoChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

export function SalesByDistritoChart({ data }: SalesByDistritoChartProps) {
  const chartData = data.map(item => ({
    name: item.name || 'Não especificado',
    'Número de Vendas': item.count,
    'Valor Total (€)': Math.round(item.totalValue),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 30, right: 40, left: 30, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          domain={[0, 'dataMax + dataMax * 0.2']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Valor Total (€)') {
              return `${value.toLocaleString('pt-PT')} €`;
            }
            return value;
          }}
        />
        <Legend />
        <Bar dataKey="Número de Vendas" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={30} />
        <Bar dataKey="Valor Total (€)" fill="#16CBC7" radius={[4, 4, 0, 0]} barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}
