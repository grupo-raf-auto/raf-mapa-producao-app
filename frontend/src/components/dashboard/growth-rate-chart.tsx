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
import { chartColors } from '@/lib/design-system';

interface GrowthRateChartProps {
  data: {
    month: string;
    growthRate: number;
    previousValue: number;
    currentValue: number;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const growthRate = payload[0]?.value ?? 0;
  const currentValue = payload[0]?.payload?.currentValue;
  const isPositive = growthRate > 0;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <dl className="mt-1.5 space-y-1">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-xs text-muted-foreground">Variação</dt>
          <dd
            className={`text-xs font-medium tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : growthRate < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}
          >
            {isPositive ? '+' : ''}
            {growthRate.toFixed(1)}%
          </dd>
        </div>
        {currentValue != null && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Valor</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {currentValue.toLocaleString('pt-PT', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
};

export function GrowthRateChart({ data }: GrowthRateChartProps) {
  const chartData =
    data.length > 1
      ? data.slice(-8).map((item) => ({
          month:
            item.month.split('-')[1] + '/' + item.month.split('-')[0].slice(-2),
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
  const avgGrowth =
    chartData.length > 0
      ? chartData.reduce((sum, item) => sum + item.growthRate, 0) /
        chartData.length
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
            <span
              className={`text-lg font-bold ${
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : latestGrowth < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {latestGrowth.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              último mês
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-muted-foreground">Média: </span>
          <span
            className={`text-sm font-medium ${avgGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {avgGrowth >= 0 ? '+' : ''}
            {avgGrowth.toFixed(1)}%
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
                <stop
                  offset="5%"
                  stopColor={chartColors.primary}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={chartColors.primary}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: chartColors.axis, fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: chartColors.axis, fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={0}
              stroke={chartColors.axis}
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="growthRate"
              stroke="transparent"
              fill="url(#growthGradient)"
            />
            <Line
              type="monotone"
              dataKey="growthRate"
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={{ fill: chartColors.primary, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
