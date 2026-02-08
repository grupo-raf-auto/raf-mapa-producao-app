'use client';

import { TemplatesManagement } from '@/components/admin/templates-management';
import { PageHeader } from '@/components/ui/page-header';
import { Shield, FileStack } from 'lucide-react';

export default function AdminTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Gestão de templates de formulários. Crie e configure modelos para submissões."
        icon={FileStack}
        iconGradient="from-slate-700 via-slate-600 to-slate-800"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-slate-500"
      />
      <TemplatesManagement />
    </div>
  );
}
