import { PageHeader } from './page-header';
import { LayoutDashboard, TrendingUp } from 'lucide-react';

export function DashboardHeader() {
  return (
    <PageHeader
      title="Dashboard"
      description="Métricas de produção e tendências."
      icon={LayoutDashboard}
      iconGradient="from-red-600 via-red-500 to-red-700"
      decoratorIcon={<TrendingUp className="w-5 h-5" />}
      decoratorColor="text-red-500"
    />
  );
}
