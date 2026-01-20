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
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Atividade Atual</p>
          <p className="text-2xl font-bold text-foreground">
            {current.value}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Média: {avgValue}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {previous ? `Período anterior: ${previous.name}` : 'Sem comparação'}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {previous?.value || 'N/A'}
          </p>
          <p className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(change) >= 0 ? '+' : ''}{change}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#5347CE"
            strokeWidth={2}
            dot={{ fill: '#5347CE', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
