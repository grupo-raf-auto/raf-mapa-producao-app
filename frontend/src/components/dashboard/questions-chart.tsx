import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { chartColors } from '@/lib/design-system';

const COLORS = [...chartColors.scale];

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
      {/* KPI Principal */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Total de Questões</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">
          {total}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {topCategory.name} ({topPercentage}%)
        </p>
      </div>

      {/* Pie Chart Simplificado */}
      <div className="w-full h-[200px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
        >
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={70}
              fill={COLORS[0]}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const name = payload[0].name;
                const value = payload[0].value;
                return (
                  <ChartTooltip
                    title={String(name ?? '')}
                    rows={[
                      {
                        label: 'Questões',
                        value:
                          value != null
                            ? Number(value).toLocaleString('pt-PT')
                            : '—',
                      },
                    ]}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
