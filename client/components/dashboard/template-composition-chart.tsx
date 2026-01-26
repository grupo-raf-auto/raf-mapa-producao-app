"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#E14840", "#C43A32", "#F06B63"];

interface TemplateCompositionChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

export function TemplateCompositionChart({
  data,
}: TemplateCompositionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de templates
      </div>
    );
  }

  const totalSubmissions = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = data.map((item, index) => ({
    name: item.name
      .replace("Registo de Produção ", "")
      .replace("Registo de Vendas ", ""),
    value: item.count,
    percentage: ((item.count / totalSubmissions) * 100).toFixed(1),
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium mb-1">{payload[0].name}</p>
          <p className="text-xs text-red-300">
            Submissões: {payload[0].value.toLocaleString("pt-PT")}
          </p>
          <p className="text-xs text-purple-300">
            {payload[0].payload.percentage}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-xs">
                  {value} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2 text-sm text-muted-foreground">
        Total: {totalSubmissions.toLocaleString("pt-PT")} submissões
      </div>
    </div>
  );
}
