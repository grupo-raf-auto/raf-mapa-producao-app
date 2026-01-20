'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: animationDelay,
      }}
      whileHover={{
        y: -4,
        scale: 1.01,
        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(0 0 0 / 0.1)",
        transition: { duration: 0.2 },
      }}
      className={cn("h-full shadow-[0_8px_16px_-4px_rgb(0_0_0_/_0.15),0_4px_8px_-2px_rgb(0_0_0_/_0.1)] dark:shadow-[0_8px_16px_-4px_rgb(0_0_0_/_0.4),0_4px_8px_-2px_rgb(0_0_0_/_0.3)]", className)}
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
    <AnimatedCard animationDelay={animationDelay} className={className}>
      <Card className="h-full transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </AnimatedCard>
  );
};
