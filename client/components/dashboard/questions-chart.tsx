"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// Paleta simplificada: 1 cor principal + tons neutros
const COLORS = [
  "#5347CE", // Primary
  "#4896FE", // Secondary
  "#10B981", // Success
  "#F59E0B", // Warning
  "#E5E7EB", // Muted
];

const data = [
  { name: "Finance", value: 35 },
  { name: "Marketing", value: 28 },
  { name: "HR", value: 20 },
  { name: "Tech", value: 12 },
  { name: "Custom", value: 5 },
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
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              fontSize: "12px",
              padding: "8px 12px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value, name) => {
              return [`${value}`, name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
