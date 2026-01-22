"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TimeFilterType } from "./time-filter";

interface DashboardStatusChartProps {
  data: { month: string; count: number; totalValue: number }[];
  timeFilter?: TimeFilterType;
}

const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toLocaleString("pt-PT")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardStatusChart({
  data,
  timeFilter = "month",
}: DashboardStatusChartProps) {
  // Transform data for the chart
  const chartData =
    data.length > 0
      ? data.map((item, index) => {
          const [year, month] = item.month.split("-");
          const monthName = monthNames[parseInt(month) - 1] || month;

          return {
            month: monthName,
            Submissões: item.count,
            "Valor (€)": Math.round(item.totalValue / 100),
          };
        })
      : monthNames.slice(0, 6).map((month) => ({
          month,
          Submissões: 0,
          "Valor (€)": 0,
        }));

  // Find the max point for annotation
  const maxPoint = chartData.reduce(
    (max, item, index) => {
      if (item["Submissões"] > (max.value || 0)) {
        return { value: item["Submissões"], month: item.month, index };
      }
      return max;
    },
    { value: 0, month: "", index: 0 },
  );

  return (
    <div className="w-full h-[280px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorDataSheet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOverallSell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F97316" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E2E8F0"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            dx={-10}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Valor Area - Orange (behind) */}
          <Area
            type="monotone"
            dataKey="Valor (€)"
            stroke="#F97316"
            strokeWidth={2}
            fill="url(#colorOverallSell)"
            dot={false}
            activeDot={{ r: 4, fill: "#F97316" }}
          />

          {/* Submissões Area - Blue (front) */}
          <Area
            type="monotone"
            dataKey="Submissões"
            stroke="#2563EB"
            strokeWidth={2.5}
            fill="url(#colorDataSheet)"
            dot={false}
            activeDot={{ r: 5, fill: "#2563EB" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Value annotation label - positioned near the peak */}
      {maxPoint.value > 0 && (
        <div
          className="absolute bg-primary text-white text-xs px-2 py-1 rounded shadow-md"
          style={{
            top: "30%",
            left: `${(maxPoint.index / Math.max(chartData.length - 1, 1)) * 70 + 15}%`,
            transform: "translateX(-50%)",
          }}
        >
          {maxPoint.value} submissões
        </div>
      )}
    </div>
  );
}
