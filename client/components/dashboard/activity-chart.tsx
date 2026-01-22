'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Jan', value: 45 },
  { name: 'Fev', value: 52 },
  { name: 'Mar', value: 48 },
  { name: 'Abr', value: 61 },
  { name: 'Mai', value: 55 },
  { name: 'Jun', value: 67 },
];

export function ActivityChart() {
  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  const change = previous ? (((current.value - previous.value) / previous.value) * 100).toFixed(1) : '0.0';
  const avgValue = Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length);

  return (
    <div className="space-y-4">
      {/* KPI Principal */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Atividade Atual</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">
          {current.value}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <p className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-success' : 'text-destructive'}`}>
            {parseFloat(change) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(change))}%
          </p>
          <p className="text-xs text-muted-foreground">
            vs {previous?.name || 'anterior'}
          </p>
        </div>
      </div>

      {/* Gráfico Simplificado */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} opacity={0.5} />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
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
            labelStyle={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#5347CE"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#5347CE' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
