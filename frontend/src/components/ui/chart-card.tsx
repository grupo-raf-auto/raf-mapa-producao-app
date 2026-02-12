import { ReactNode } from 'react';
import { BorderRotate } from './animated-gradient-border';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

const glowGradients: Record<string, { primary: string; secondary: string; accent: string }> = {
  blue: { primary: '#1e3a5f', secondary: '#3b82f6', accent: '#93c5fd' },
  purple: { primary: '#3b1f6e', secondary: '#8b5cf6', accent: '#c4b5fd' },
  green: { primary: '#14532d', secondary: '#22c55e', accent: '#86efac' },
  red: { primary: '#5c1a1a', secondary: '#ef4444', accent: '#fca5a5' },
  orange: { primary: '#5c2d0e', secondary: '#f97316', accent: '#fdba74' },
};

export function ChartCard({ children, className, glowColor = 'blue' }: ChartCardProps) {
  const colors = glowGradients[glowColor] ?? glowGradients.blue;

  return (
    <BorderRotate
      animationMode="rotate-on-hover"
      animationSpeed={3}
      gradientColors={colors}
      backgroundColor="var(--card)"
      borderWidth={2}
      borderRadius={16}
      className={cn('h-full relative', className)}
    >
      <div className="chart-card h-full w-full border-0" style={{ border: 'none', boxShadow: 'none' }}>
        {children}
      </div>
    </BorderRotate>
  );
}
