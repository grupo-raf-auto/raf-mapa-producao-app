"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface TicketMedioAgenteChartProps {
  data: { name: string; averageValue: number }[];
  globalAverage?: number;
}

export function TicketMedioAgenteChart({
  data,
  globalAverage = 0,
}: TicketMedioAgenteChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de ticket médio
      </div>
    );
  }

  const top10 = data.slice(0, 10);

  const chartData = top10.map((item) => ({
    name:
      item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name,
    value: item.averageValue,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium mb-1">{payload[0].payload.name}</p>
          <p className="text-xs text-orange-300">
            Ticket Médio:{" "}
            {payload[0].value.toLocaleString("pt-PT", {
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
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 9 }}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 10 }}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
          />
          {globalAverage > 0 && (
            <ReferenceLine
              y={globalAverage}
              stroke="#E14840"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Média: ${(globalAverage / 1000).toFixed(0)}k`,
                position: "right",
                fill: "#E14840",
                fontSize: 10,
              }}
            />
          )}
          <Bar
            dataKey="value"
            fill="#E14840"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
