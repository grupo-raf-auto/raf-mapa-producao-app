'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

// Define the icon type. Using React.ElementType for flexibility.
type IconType = React.ElementType | React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

// Define trend types
export type TrendType = 'up' | 'down' | 'neutral';

// --- 📦 API (Props) Definition ---
export interface DashboardMetricCardProps {
  /** The main value of the metric (e.g., "1,234", "$5.6M", "92%"). */
  value: string | number;
  /** The descriptive title of the metric (e.g., "Total Users", "Revenue"). */
  title: string;
  /** Optional icon to display in the card header. */
  icon?: IconType;
  /** Optional description text below the value. */
  description?: string;
  /** The percentage or absolute change for the trend (e.g., "2.5%"). */
  trendChange?: string;
  /** The direction of the trend ('up', 'down', 'neutral'). */
  trendType?: TrendType;
  /** Optional class name for the card container. */
  className?: string;
  /** Animation delay for staggered entrance animations */
  animationDelay?: number;
}

/**
 * A professional, animated metric card for admin dashboards.
 * Displays a key value, title, icon, and trend indicator with Framer Motion hover effects.
 */
export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  value,
  title,
  icon: IconComponent,
  description,
  trendChange,
  trendType = 'neutral',
  className,
  animationDelay = 0,
}) => {
  // Determine trend icon and color
  const TrendIcon = trendType === 'up' ? ArrowUp : trendType === 'down' ? ArrowDown : Minus;
  const trendColorClass =
    trendType === 'up'
      ? "text-green-600 dark:text-green-400"
      : trendType === 'down'
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay: animationDelay 
      }}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(0 0 0 / 0.1)" 
      }}
      className={cn(
        "cursor-pointer rounded-lg shadow-[0_8px_16px_-4px_rgb(0_0_0_/_0.15),0_4px_8px_-2px_rgb(0_0_0_/_0.1)] dark:shadow-[0_8px_16px_-4px_rgb(0_0_0_/_0.4),0_4px_8px_-2px_rgb(0_0_0_/_0.3)]",
        className
      )}
    >
      <Card className="h-full transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {IconComponent && (
            <IconComponent className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground mb-2">
            {typeof value === 'number' ? value.toLocaleString('pt-PT') : value}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
          {trendChange && (
            <p className={cn("flex items-center text-xs font-medium mt-1", trendColorClass)}>
              <TrendIcon className="h-3 w-3 mr-1" aria-hidden="true" />
              {trendChange} {trendType === 'up' ? "aumento" : trendType === 'down' ? "diminuição" : "mudança"}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
