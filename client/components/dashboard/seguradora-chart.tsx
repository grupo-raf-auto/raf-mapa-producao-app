"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SeguradoraChartProps {
  data: {
    name: string;
    count: number;
    totalValue: number;
    averageValue?: number;
  }[];
}

const COLORS = ["#E14840", "#C43A32", "#F06B63", "#F58E87", "#A72C25"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-xs text-purple-300">
          Quantidade: {payload[0]?.value?.toLocaleString("pt-PT")}
        </p>
        {payload[0]?.payload?.totalValue && (
          <p className="text-xs text-purple-200">
            Valor:{" "}
            {payload[0].payload.totalValue.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
            })}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function SeguradoraChart({ data }: SeguradoraChartProps) {
  const chartData =
    data.length > 0
      ? data.slice(0, 5).map((item, index) => ({
          name:
            item.name.length > 12
              ? item.name.substring(0, 12) + "..."
              : item.name,
          fullName: item.name,
          count: item.count,
          totalValue: item.totalValue,
          color: COLORS[index % COLORS.length],
        }))
      : [
          { name: "Fidelidade", count: 0, totalValue: 0, color: COLORS[0] },
          { name: "Allianz", count: 0, totalValue: 0, color: COLORS[1] },
          { name: "Tranquilidade", count: 0, totalValue: 0, color: COLORS[2] },
        ];

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
            width={90}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
