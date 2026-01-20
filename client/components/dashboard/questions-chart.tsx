'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const COLORS = ['#5347CE', '#887CFD', '#4896FE', '#16CBC7', '#16A34A'];

const data = [
  { name: 'Finance', value: 35 },
  { name: 'Marketing', value: 28 },
  { name: 'HR', value: 20 },
  { name: 'Tech', value: 12 },
  { name: 'Custom', value: 5 },
];

export function QuestionsChart() {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const topCategory = data[0];
  const topPercentage = Math.round((topCategory.value / total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total de Questões</p>
          <p className="text-2xl font-bold text-foreground">
            {total}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Top Categoria</p>
          <p className="text-sm font-medium text-foreground">
            {topCategory.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {topPercentage}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="square" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
