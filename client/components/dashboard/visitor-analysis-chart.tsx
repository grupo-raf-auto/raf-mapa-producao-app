"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface VisitorAnalysisChartProps {
  data: { name: string; count: number; totalValue: number }[];
}

// Color palette matching DATASOFT design
const COLORS = ["#2563EB", "#14B8A6", "#F97316", "#8B5CF6", "#64748B"];

const defaultData = [
  { name: "Lisboa", value: 35, color: COLORS[0] },
  { name: "Porto", value: 25, color: COLORS[1] },
  { name: "Braga", value: 18, color: COLORS[2] },
  { name: "Setúbal", value: 12, color: COLORS[3] },
  { name: "Outros", value: 10, color: COLORS[4] },
];

export function VisitorAnalysisChart({ data }: VisitorAnalysisChartProps) {
  // Transform data or use default
  const chartData =
    data.length > 0
      ? data.slice(0, 5).map((item, index) => ({
          name: item.name || "Unknown",
          value: item.count,
          color: COLORS[index % COLORS.length],
        }))
      : defaultData;

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col items-center">
      {/* Donut Chart */}
      <div className="relative w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {total.toLocaleString("pt-PT")}
          </span>
          <span className="text-xs text-muted-foreground">Submissões</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full mt-4 space-y-2">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-foreground">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
