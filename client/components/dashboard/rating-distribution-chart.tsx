"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#E14840", "#C43A32", "#F06B63", "#F58E87", "#A72C25"];

interface RatingDistributionChartProps {
  data: { rating: string; count: number; totalValue: number }[];
}

export function RatingDistributionChart({
  data,
}: RatingDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de rating
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    rating: item.rating,
    count: item.count,
    totalValue: item.totalValue,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium mb-1">Rating {payload[0].payload.rating}</p>
          <p className="text-xs text-green-300">
            Clientes: {payload[0].value.toLocaleString("pt-PT")}
          </p>
          <p className="text-xs text-red-300">
            Valor Total:{" "}
            {payload[0].payload.totalValue.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="rating"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 10 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
