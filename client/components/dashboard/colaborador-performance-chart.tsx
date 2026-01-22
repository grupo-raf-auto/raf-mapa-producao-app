'use client';

import { Trophy, TrendingUp, Target } from 'lucide-react';

interface ColaboradorPerformanceChartProps {
  data: {
    userId: string;
    name: string;
    count: number;
    totalValue: number;
    averageValue?: number;
  }[];
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function ColaboradorPerformanceChart({ data }: ColaboradorPerformanceChartProps) {
  const sortedData = data.length > 0 ? data.slice(0, 5) : [];

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sem dados de colaboradores
      </div>
    );
  }

  const maxValue = Math.max(...sortedData.map(d => d.totalValue));

  return (
    <div className="space-y-3 h-[260px] overflow-y-auto pr-2">
      {sortedData.map((item, index) => {
        const percentage = maxValue > 0 ? (item.totalValue / maxValue) * 100 : 0;
        const isTop3 = index < 3;

        return (
          <div
            key={item.userId}
            className={`p-3 rounded-lg border transition-all ${
              index === 0
                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800'
                : 'bg-muted/30 border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Position/Medal */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {isTop3 ? (
                  <Trophy
                    className="w-5 h-5"
                    style={{ color: MEDAL_COLORS[index] }}
                  />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Name and Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium truncate ${index === 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold text-foreground ml-2">
                    {item.totalValue.toLocaleString('pt-PT', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                        : index === 1
                        ? 'bg-gradient-to-r from-slate-400 to-slate-500'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                        : 'bg-primary/60'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {item.count} operacoes
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Media: {(item.averageValue || 0).toLocaleString('pt-PT', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
