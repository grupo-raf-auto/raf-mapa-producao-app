"use client";

import {
  FileStack,
  TrendingUp,
  Euro,
  BarChart3,
  Users,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import {
  DashboardMetricCard,
  SparklineType,
  ColorVariant,
} from "@/components/ui/dashboard-metric-card";

interface KPICardData {
  title: string;
  value: string | number;
  iconName:
    | "TrendingUp"
    | "Euro"
    | "BarChart3"
    | "FileStack"
    | "Users"
    | "ShoppingCart"
    | "Calendar";
  description?: string;
  trendChange?: string;
  trendType?: "up" | "down" | "neutral";
  sparklineType?: SparklineType;
  sparklineData?: number[];
  colorVariant?: ColorVariant;
}

interface KPICardsProps {
  cards: KPICardData[];
}

const iconMap = {
  TrendingUp,
  Euro,
  BarChart3,
  FileStack,
  Users,
  ShoppingCart,
  Calendar,
};

// Color variants for each card position
const colorVariants: ColorVariant[] = ["blue", "teal", "green", "red"];

// Default sparkline data for each card type
const defaultSparklineData: Record<string, number[]> = {
  "Total Revenue": [30, 45, 35, 50, 40, 55, 45, 60, 50, 65],
  "Today's Sale": [20, 35, 25, 40, 30, 45, 35, 50, 40, 55],
  default: [25, 40, 30, 45, 35, 50, 40, 55, 45, 60],
};

export function KPICards({ cards }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((kpi, index) => {
        const IconComponent = iconMap[kpi.iconName];
        const colorVariant =
          kpi.colorVariant || colorVariants[index % colorVariants.length];
        const sparklineData =
          kpi.sparklineData ||
          defaultSparklineData[kpi.title] ||
          defaultSparklineData["default"];

        return (
          <DashboardMetricCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={IconComponent}
            description={kpi.description}
            trendChange={kpi.trendChange}
            trendType={kpi.trendType}
            animationDelay={index * 0.08}
            sparklineType={kpi.sparklineType || "bars"}
            sparklineData={sparklineData}
            colorVariant={colorVariant}
          />
        );
      })}
    </div>
  );
}
