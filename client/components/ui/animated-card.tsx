'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  animationDelay?: number;
}

/**
 * A wrapper component that adds entrance animations to any card content.
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  animationDelay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: animationDelay,
      }}
      className={cn("h-full", className)}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedChartCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  animationDelay?: number;
}

/**
 * A pre-configured animated card for chart displays.
 */
export const AnimatedChartCard: React.FC<AnimatedChartCardProps> = ({
  title,
  icon,
  children,
  className,
  animationDelay = 0,
}) => {
  return (
    <AnimatedCard animationDelay={animationDelay} className={cn("w-full h-full", className)}>
      <Card className="h-full">
        <div className="h-full flex flex-col p-5">
          <div className="mb-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              {icon && <span className="text-muted-foreground">{icon}</span>}
              {title}
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </div>
      </Card>
    </AnimatedCard>
  );
};
