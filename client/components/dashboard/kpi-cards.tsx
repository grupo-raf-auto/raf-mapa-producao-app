'use client';

import {
  FileStack,
  TrendingUp,
  Euro,
  BarChart3,
} from 'lucide-react';
import { DashboardMetricCard } from '@/components/ui/dashboard-metric-card';

interface KPICardData {
  title: string;
  value: string | number;
  iconName: 'TrendingUp' | 'Euro' | 'BarChart3' | 'FileStack';
  description: string;
}

interface KPICardsProps {
  cards: KPICardData[];
}

const iconMap = {
  TrendingUp,
  Euro,
  BarChart3,
  FileStack,
};

export function KPICards({ cards }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((kpi, index) => {
        const IconComponent = iconMap[kpi.iconName];
        return (
          <DashboardMetricCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={IconComponent}
            description={kpi.description}
            animationDelay={index * 0.1}
          />
        );
      })}
    </div>
  );
}
