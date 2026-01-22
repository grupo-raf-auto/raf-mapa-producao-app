'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GrowthRateChartProps {
  data: {
    month: string;
    growthRate: number;
    previousValue: number;
    currentValue: number;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const growthRate = payload[0]?.value || 0;
    const data = payload[0]?.payload;
    const isPositive = growthRate > 0;

    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-medium mb-1">{label}</p>
        <p className={`text-xs ${isPositive ? 'text-emerald-400' : growthRate < 0 ? 'text-red-400' : 'text-slate-400'}`}>
          Crescimento: {isPositive ? '+' : ''}{growthRate.toFixed(1)}%
        </p>
        <p className="text-xs text-slate-300">
          Valor: {data?.currentValue?.toLocaleString('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          })}
        </p>
      </div>
    );
  }
  return null;
};

export function GrowthRateChart({ data }: GrowthRateChartProps) {
  const chartData = data.length > 1
    ? data.slice(-8).map(item => ({
        month: item.month.split('-')[1] + '/' + item.month.split('-')[0].slice(-2),
        growthRate: Math.round(item.growthRate * 10) / 10,
        currentValue: item.currentValue,
      }))
    : [];

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        Dados insuficientes para calcular crescimento
      </div>
    );
  }

  // Calculate average growth rate
  const avgGrowth = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.growthRate, 0) / chartData.length
    : 0;

  // Get the most recent growth rate for the summary
  const latestGrowth = chartData[chartData.length - 1]?.growthRate || 0;
  const isPositive = latestGrowth > 0;

  return (
    <div className="space-y-3">
      {/* Summary Stat */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {isPositive ? (
            <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : latestGrowth < 0 ? (
            <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          ) : (
            <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <Minus className="w-4 h-4 text-slate-500" />
            </div>
          )}
          <div>
            <span className={`text-lg font-bold ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' :
              latestGrowth < 0 ? 'text-red-600 dark:text-red-400' :
              'text-slate-500'
            }`}>
              {isPositive ? '+' : ''}{latestGrowth.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">ultimo mes</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-muted-foreground">Media: </span>
          <span className={`text-sm font-medium ${avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {avgGrowth >= 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="growthRate"
              stroke="transparent"
              fill="url(#growthGradient)"
            />
            <Line
              type="monotone"
              dataKey="growthRate"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
