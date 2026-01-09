'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SalesTimelineChartProps {
  data: { month: string; count: number; totalValue: number }[];
}

export function SalesTimelineChart({ data }: SalesTimelineChartProps) {
  const chartData = data.map(item => {
    // Formatar mês para exibição (ex: "2024-01" -> "Jan 2024")
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    
    return {
      month: `${monthName} ${year}`,
      'Número de Vendas': item.count,
      'Valor Total (€)': Math.round(item.totalValue),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="month"
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
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
        <Line
          type="monotone"
          dataKey="Número de Vendas"
          stroke="#5347CE"
          strokeWidth={2}
          dot={{ fill: '#5347CE', r: 4 }}
          name="Número de Vendas"
        />
        <Line
          type="monotone"
          dataKey="Valor Total (€)"
          stroke="#16CBC7"
          strokeWidth={2}
          dot={{ fill: '#16CBC7', r: 4 }}
          name="Valor Total (€)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
