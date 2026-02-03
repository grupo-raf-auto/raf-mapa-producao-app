"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type IconType =
  | React.ElementType
  | React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
export type TrendType = "up" | "down" | "neutral";
export type SparklineType = "line" | "bars" | "area";
export type ColorVariant =
  | "blue"
  | "teal"
  | "orange"
  | "purple"
  | "green"
  | "red";

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
  if (!data || data.length === 0) return "";

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  if (type === "area") {
    const pathData = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");
    return `${pathData} L ${width} ${height} L 0 ${height} Z`;
  }

  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
}

// Sparkline component
function Sparkline({
  data,
  type = "line",
  color = "#2563EB",
  width = 80,
  height = 40,
}: {
  data: number[];
  type?: SparklineType;
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) {
    // Default sparkline data
    data = [30, 45, 35, 50, 40, 55, 45, 60, 50, 65];
  }

  const padding = 4;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  if (type === "bars") {
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

  if (type === "area") {
    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient
            id={`gradient-${color.replace("#", "")}`}
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
            fill={`url(#gradient-${color.replace("#", "")})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d={generateSparklinePath(data, "line", innerWidth, innerHeight)}
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

// Color mappings
const colorMap: Record<
  ColorVariant,
  { bg: string; text: string; icon: string }
> = {
  blue: { bg: "rgba(37, 99, 235, 0.1)", text: "#2563EB", icon: "#2563EB" },
  teal: { bg: "rgba(20, 184, 166, 0.1)", text: "#14B8A6", icon: "#14B8A6" },
  orange: { bg: "rgba(249, 115, 22, 0.1)", text: "#F97316", icon: "#F97316" },
  purple: { bg: "rgba(139, 92, 246, 0.1)", text: "#8B5CF6", icon: "#8B5CF6" },
  green: { bg: "rgba(16, 185, 129, 0.1)", text: "#10B981", icon: "#10B981" },
  red: { bg: "rgba(239, 68, 68, 0.1)", text: "#EF4444", icon: "#EF4444" },
};

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  value,
  title,
  icon: IconComponent,
  description,
  trendChange,
  trendType = "neutral",
  className,
  animationDelay = 0,
  sparklineType = "bars",
  sparklineData,
  colorVariant = "blue",
}) => {
  const colors = colorMap[colorVariant];

  const TrendIcon =
    trendType === "up"
      ? TrendingUp
      : trendType === "down"
        ? TrendingDown
        : Minus;
  const trendColorClass =
    trendType === "up"
      ? "text-emerald-500"
      : trendType === "down"
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: animationDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "kpi-card relative flex items-center justify-between gap-4",
        className,
      )}
    >
      {/* Left side - Icon, Value, Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon */}
        {IconComponent && (
          <div
            className="kpi-card-icon flex-shrink-0"
            style={{ backgroundColor: colors.bg }}
          >
            <IconComponent
              className="h-4 w-4"
              style={{ color: colors.icon }}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Text content */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: colors.text }}
            >
              {typeof value === "number"
                ? value.toLocaleString("pt-PT")
                : value}
            </span>
            {trendChange && (
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  trendColorClass,
                )}
              >
                <TrendIcon className="h-3 w-3 mr-0.5" />
                {trendChange}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {title}
          </p>
        </div>
      </div>

      {/* Right side - Sparkline */}
      <div className="flex-shrink-0">
        <Sparkline
          data={sparklineData || []}
          type={sparklineType}
          color={colors.text}
          width={56}
          height={28}
        />
      </div>
    </motion.div>
  );
};

// Simplified card without sparkline for other uses
export const SimpleMetricCard: React.FC<
  Omit<DashboardMetricCardProps, "sparklineType" | "sparklineData">
> = (props) => {
  return <DashboardMetricCard {...props} sparklineType="line" />;
};
