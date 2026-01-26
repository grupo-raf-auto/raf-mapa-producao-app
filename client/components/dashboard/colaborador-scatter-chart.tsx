"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

interface ColaboradorScatterChartProps {
  data: {
    userId: string;
    name: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }[];
}

export function ColaboradorScatterChart({
  data,
}: ColaboradorScatterChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de colaboradores
      </div>
    );
  }

  const chartData = data.map((item) => ({
    x: item.totalValue,
    y: item.count,
    z: item.averageValue / 1000,
    name: item.name,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium mb-1">{payload[0].payload.name}</p>
          <p className="text-xs text-green-300">
            Valor Total:{" "}
            {payload[0].payload.x.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
            })}
          </p>
          <p className="text-xs text-red-300">
            Operações: {payload[0].payload.y}
          </p>
          <p className="text-xs text-purple-300">
            Ticket Médio:{" "}
            {(payload[0].payload.z * 1000).toLocaleString("pt-PT", {
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
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            type="number"
            dataKey="x"
            name="Valor"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 10 }}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            label={{ value: "Valor Total (€)", position: "bottom", fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Quantidade"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 10 }}
            label={{
              value: "Operações",
              angle: -90,
              position: "insideLeft",
              fontSize: 10,
            }}
          />
          <ZAxis
            type="number"
            dataKey="z"
            range={[50, 400]}
            name="Ticket Médio"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: "3 3" }}
          />
          <Scatter data={chartData} fill="#E14840" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
