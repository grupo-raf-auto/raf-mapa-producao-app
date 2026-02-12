import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  ArrowUp,
  Minus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { BorderRotate } from '@/components/ui/animated-gradient-border';

type IconType =
  | React.ElementType
  | React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
export type TrendType = 'up' | 'down' | 'neutral';
export type SparklineType = 'line' | 'bars' | 'area';
export type ColorVariant =
  | 'blue'
  | 'teal'
  | 'orange'
  | 'purple'
  | 'green'
  | 'red';

export interface DashboardMetricCardProps {
  value: string | number;
  title: string;
  icon?: IconType;
  description?: string;
  trendChange?: string;
  trendType?: TrendType;
  className?: string;
  animationDelay?: number;
  sparklineType?: SparklineType;
  sparklineData?: number[];
  colorVariant?: ColorVariant;
}

// Generate sparkline paths
function generateSparklinePath(
  data: number[],
  type: SparklineType,
  width: number,
  height: number,
): string {
  if (!data || data.length === 0) return '';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  if (type === 'area') {
    const pathData = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(' ');
    return `${pathData} L ${width} ${height} L 0 ${height} Z`;
  }

  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');
}

// Sparkline component
function Sparkline({
  data,
  type = 'line',
  color = '#6366F1',
  width = 80,
  height = 40,
}: {
  data: number[];
  type?: SparklineType;
  color?: string;
  width?: number;
  height?: number;
}) {
  const padding = 4;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // Sem dados: linha plana na base (evita dados fictícios)
  if (!data || data.length === 0) {
    const flatY = innerHeight;
    const path = `M 0 ${flatY} L ${innerWidth} ${flatY}`;
    return (
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        aria-hidden
      >
        <g transform={`translate(${padding}, ${padding})`}>
          <path
            d={path}
            stroke={color}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="4 4"
            opacity={0.4}
          />
        </g>
      </svg>
    );
  }

  if (type === 'bars') {
    const barWidth = (innerWidth / data.length) * 0.7;
    const gap = (innerWidth / data.length) * 0.3;
    const max = Math.max(...data);

    return (
      <svg width={width} height={height} className="overflow-visible">
        {data.map((value, index) => {
          const barHeight = (value / max) * innerHeight;
          const x = padding + index * (barWidth + gap);
          const y = height - padding - barHeight;

          return (
            <motion.rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              fill={color}
              opacity={0.8}
              initial={{ height: 0, y: height - padding }}
              animate={{ height: barHeight, y }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            />
          );
        })}
      </svg>
    );
  }

  const path = generateSparklinePath(data, type, innerWidth, innerHeight);

  if (type === 'area') {
    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient
            id={`gradient-${color.replace('#', '')}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${padding}, ${padding})`}>
          <motion.path
            d={path}
            fill={`url(#gradient-${color.replace('#', '')})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d={generateSparklinePath(data, 'line', innerWidth, innerHeight)}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8 }}
          />
        </g>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <g transform={`translate(${padding}, ${padding})`}>
        <motion.path
          d={path}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />
        {/* End dot */}
        <motion.circle
          cx={innerWidth}
          cy={
            data[data.length - 1]
              ? innerHeight -
                ((data[data.length - 1] - Math.min(...data)) /
                  (Math.max(...data) - Math.min(...data) || 1)) *
                  innerHeight
              : innerHeight / 2
          }
          r={3}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, duration: 0.2 }}
        />
      </g>
    </svg>
  );
}

// Professional palette aligned with dashboard charts (design-system)
const colorMap: Record<
  ColorVariant,
  { bg: string; text: string; icon: string }
> = {
  blue: { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366F1', icon: '#6366F1' },
  teal: { bg: 'rgba(13, 148, 136, 0.12)', text: '#0D9488', icon: '#0D9488' },
  orange: { bg: 'rgba(194, 65, 58, 0.12)', text: '#C2413A', icon: '#C2413A' },
  purple: { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366F1', icon: '#6366F1' },
  green: { bg: 'rgba(15, 118, 110, 0.12)', text: '#0F766E', icon: '#0F766E' },
  red: { bg: 'rgba(185, 28, 28, 0.12)', text: '#B91C1C', icon: '#B91C1C' },
};

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  value,
  title,
  icon: IconComponent,
  description,
  trendChange,
  trendType = 'neutral',
  className,
  animationDelay = 0,
  sparklineType = 'bars',
  sparklineData,
  colorVariant = 'blue',
}) => {
  const colors = colorMap[colorVariant];

  const TrendIcon =
    trendType === 'up'
      ? TrendingUp
      : trendType === 'down'
        ? TrendingDown
        : Minus;
  const trendColorClass =
    trendType === 'up'
      ? 'text-emerald-500'
      : trendType === 'down'
        ? 'text-red-500'
        : 'text-muted-foreground';

  const kpiGradients: Record<string, { primary: string; secondary: string; accent: string }> = {
    blue: { primary: '#1e3a5f', secondary: '#3b82f6', accent: '#93c5fd' },
    teal: { primary: '#134e4a', secondary: '#14b8a6', accent: '#5eead4' },
    green: { primary: '#14532d', secondary: '#22c55e', accent: '#86efac' },
    purple: { primary: '#3b1f6e', secondary: '#8b5cf6', accent: '#c4b5fd' },
    orange: { primary: '#5c2d0e', secondary: '#f97316', accent: '#fdba74' },
    red: { primary: '#5c1a1a', secondary: '#ef4444', accent: '#fca5a5' },
  };

  const gradientColors = kpiGradients[colorVariant] ?? kpiGradients.blue;

  return (
    <BorderRotate
      animationMode="rotate-on-hover"
      animationSpeed={3}
      gradientColors={gradientColors}
      backgroundColor="var(--card)"
      borderWidth={2}
      borderRadius={16}
      className={cn('', className)}
    >
      <motion.article
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: animationDelay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className={cn(
          'kpi-card relative flex items-center justify-between gap-2 sm:gap-3 w-full h-full border-0 !p-3 sm:!p-3.5',
        )}
        style={{ border: 'none', boxShadow: 'none' }}
      >
      {/* Left side - Icon, Value, Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {IconComponent && (
          <div
            className="kpi-card-icon shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: colors.bg }}
          >
            <IconComponent
              className="h-4 w-4"
              style={{ color: colors.icon }}
              aria-hidden
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <span
            className="block text-base sm:text-lg font-bold tracking-tight leading-tight truncate"
            style={{ color: colors.text }}
          >
            {typeof value === 'number' ? value.toLocaleString('pt-PT') : value}
          </span>
          <p className="text-xs font-medium text-foreground mt-1 truncate">
            {title}
          </p>
          {(trendChange || description) && (
            <p
              className={cn(
                'text-xs mt-0.5 truncate',
                trendChange ? trendColorClass : 'text-muted-foreground',
              )}
            >
              {trendChange ? (
                <span className="flex items-center gap-1">
                  <TrendIcon className="h-2.5 w-2.5 shrink-0" />
                  {trendChange}
                </span>
              ) : (
                description
              )}
            </p>
          )}
        </div>
      </div>

      {sparklineData && sparklineData.length > 2 && (
        <div className="shrink-0 hidden min-[480px]:block" aria-hidden>
          <Sparkline
            data={sparklineData}
            type={sparklineType}
            color={colors.text}
            width={48}
            height={24}
          />
        </div>
      )}
      </motion.article>
    </BorderRotate>
  );
};

// Simplified card without sparkline for other uses
export const SimpleMetricCard: React.FC<
  Omit<DashboardMetricCardProps, 'sparklineType' | 'sparklineData'>
> = (props) => {
  return <DashboardMetricCard {...props} sparklineType="line" />;
};
