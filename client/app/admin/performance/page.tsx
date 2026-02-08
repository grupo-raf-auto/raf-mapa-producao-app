'use client';

import { UserPerformance } from '@/components/admin/user-performance';
import { PageHeader } from '@/components/ui/page-header';
import { Shield, TrendingUp } from 'lucide-react';

export default function AdminPerformancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Desempenho"
        description="Análise de métricas e desempenho dos utilizadores. Acompanhe produtividade e resultados."
        icon={TrendingUp}
        iconGradient="from-slate-700 via-slate-600 to-slate-800"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-slate-500"
      />
      <UserPerformance />
    </div>
  );
}
