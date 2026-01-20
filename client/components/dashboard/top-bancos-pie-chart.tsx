'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface TopBancosPieChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

const COLORS = [
  '#5347CE',
  '#887CFD',
  '#4896FE',
  '#16CBC7',
  '#16A34A',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
];

export function TopBancosPieChart({ data }: TopBancosPieChartProps) {
  // Pegar top 8 bancos por valor
  const topBancos = data.slice(0, 8).map((item) => ({
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

  const totalValue = topBancos.reduce((sum, item) => sum + item.value, 0);
  const topBanco = topBancos[0];
  const topPercentage = Math.round((topBanco.value / totalValue) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Distribuição Top 8</p>
          <p className="text-2xl font-bold text-foreground">
            {totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Top Banco</p>
          <p className="text-sm font-medium text-foreground">
            {topBanco.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {topPercentage}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={topBancos}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
          >
            {topBancos.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, props: unknown) => {
              const v = value != null ? Number(value) : 0;
              const p = props as { payload?: { count?: number } };
              const count = p?.payload?.count ?? 0;
              return [`${v.toLocaleString('pt-PT')} € (${count} vendas)`, 'Valor Total'];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="square" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
