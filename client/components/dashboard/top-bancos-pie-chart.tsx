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

// Paleta simplificada: 1 cor principal + tons neutros
const COLORS = [
  '#5347CE', // Primary
  '#4896FE', // Secondary
  '#10B981', // Success
  '#F59E0B', // Warning
  '#E5E7EB', // Muted
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
      <div className="flex items-center justify-center h-[220px] text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }

  const totalValue = topBancos.reduce((sum, item) => sum + item.value, 0);
  const topBanco = topBancos[0];
  const topPercentage = Math.round((topBanco.value / totalValue) * 100);

  const totalVisits = topBancos.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      {/* KPI Principal */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Total de Vendas</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">
          {totalVisits.toLocaleString('pt-PT')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {topBancos.length} bancos
        </p>
      </div>

      {/* Donut Chart Simplificado */}
      <div className="flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={topBancos.slice(0, 5)}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {topBancos.slice(0, 5).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
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
                const v = value != null ? Number(value) : 0;
                return `${v.toLocaleString('pt-PT')} €`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
