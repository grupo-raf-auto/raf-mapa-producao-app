'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

interface TicketMedioChartProps {
  data: { name: string; count: number; totalValue: number; averageValue?: number }[];
  globalAverage?: number;
}

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const avgValue = payload[0]?.value || 0;
    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-xs text-blue-300">
          Ticket Medio: {avgValue.toLocaleString('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          })}
        </p>
        <p className="text-xs text-blue-200">
          Operacoes: {payload[0]?.payload?.count?.toLocaleString('pt-PT')}
        </p>
      </div>
    );
  }
  return null;
};

export function TicketMedioChart({ data, globalAverage }: TicketMedioChartProps) {
  const chartData = data.length > 0
    ? data.slice(0, 6).map((item, index) => ({
        name: item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name,
        fullName: item.name,
        averageValue: Math.round(item.averageValue || (item.count > 0 ? item.totalValue / item.count : 0)),
        count: item.count,
        color: COLORS[index % COLORS.length],
      }))
    : [];

  const avgLine = globalAverage || (chartData.length > 0
    ? Math.round(chartData.reduce((sum, item) => sum + item.averageValue, 0) / chartData.length)
    : 0);

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 10, left: -10, bottom: 0 }}
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
            tick={{ fill: '#64748B', fontSize: 10 }}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
          {avgLine > 0 && (
            <ReferenceLine
              y={avgLine}
              stroke="#F97316"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Media: ${(avgLine / 1000).toFixed(0)}k`,
                position: 'right',
                fill: '#F97316',
                fontSize: 10,
              }}
            />
          )}
          <Bar dataKey="averageValue" radius={[4, 4, 0, 0]} maxBarSize={32}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
