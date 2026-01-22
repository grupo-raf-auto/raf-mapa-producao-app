'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface OverallSellProgressChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

// Usar nomes dos bancos em vez de dias

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.fill }}>
            {entry.name}: {entry.value?.toLocaleString('pt-PT')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function OverallSellProgressChart({ data }: OverallSellProgressChartProps) {
  // Transform data or use default
  const chartData = data.length > 0
    ? data.slice(0, 7).map((item) => ({
        name: item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name,
        Quantidade: item.count,
        'Valor (k€)': Math.round(item.totalValue / 1000),
      }))
    : [
        { name: 'CGD', Quantidade: 0, 'Valor (k€)': 0 },
        { name: 'BPI', Quantidade: 0, 'Valor (k€)': 0 },
        { name: 'Santander', Quantidade: 0, 'Valor (k€)': 0 },
        { name: 'Millennium', Quantidade: 0, 'Valor (k€)': 0 },
        { name: 'Novobanco', Quantidade: 0, 'Valor (k€)': 0 },
      ];

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 10 }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11 }}
            dx={-5}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />

          <Bar
            dataKey="Quantidade"
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />

          <Bar
            dataKey="Valor (k€)"
            fill="#14B8A6"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
