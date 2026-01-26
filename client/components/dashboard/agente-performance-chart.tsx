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

interface AgentePerformanceChartProps {
  data: {
    name: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }[];
  globalAverage?: number;
}

export function AgentePerformanceChart({
  data,
  globalAverage = 0,
}: AgentePerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de agentes
      </div>
    );
  }

  const top10 = data.slice(0, 10);

  const chartData = top10.map((item) => {
    let color = "#F06B63";
    if (item.averageValue > globalAverage * 1.1) {
      color = "#E14840";
    } else if (item.averageValue < globalAverage * 0.9) {
      color = "#A72C25";
    }

    return {
      name:
        item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
      totalValue: item.totalValue,
      count: item.count,
      averageValue: item.averageValue,
      color,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium mb-1">{payload[0].payload.name}</p>
          <p className="text-xs text-green-300">
            Total:{" "}
            {payload[0].value.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
            })}
          </p>
          <p className="text-xs text-red-300">
            Operações: {payload[0].payload.count}
          </p>
          <p className="text-xs text-purple-300">
            Ticket Médio:{" "}
            {payload[0].payload.averageValue.toLocaleString("pt-PT", {
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
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 10 }}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 10 }}
            width={120}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
          />
          <Bar dataKey="totalValue" radius={[0, 4, 4, 0]} maxBarSize={30}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
