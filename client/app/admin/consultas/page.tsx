'use client';

import { AdminConsultasContent } from '@/components/admin/admin-consultas-content';
import { PageHeader } from '@/components/ui/page-header';
import { Shield, Search } from 'lucide-react';

export default function AdminConsultasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultas"
        description="Visualize todas as consultas realizadas no sistema. Filtre por data, utilizador e status."
        icon={Search}
        iconGradient="from-slate-700 via-slate-600 to-slate-800"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-slate-500"
      />
      <AdminConsultasContent />
    </div>
  );
}
