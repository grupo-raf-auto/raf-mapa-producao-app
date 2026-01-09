'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TopBancosPieChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

const COLORS = ['#5347CE', '#887CFD', '#4896FE', '#16CBC7', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6'];

export function TopBancosPieChart({ data }: TopBancosPieChartProps) {
  // Pegar top 8 bancos por valor
  const topBancos = data
    .slice(0, 8)
    .map(item => ({
      name: item.name || 'Não especificado',
      value: Math.round(item.totalValue),
      count: item.count,
    }));

  if (topBancos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={topBancos}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => 
            `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {topBancos.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string, props: any) => {
            return [
              `${value.toLocaleString('pt-PT')} € (${props.payload.count} vendas)`,
              'Valor Total'
            ];
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
