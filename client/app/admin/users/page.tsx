'use client';

import { UsersManagement } from '@/components/admin/users-management';
import { PageHeader } from '@/components/ui/page-header';
import { Shield, Users } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores"
        description="Gestão de utilizadores do sistema. Crie, edite e configure permissões de acesso."
        icon={Users}
        iconGradient="from-slate-700 via-slate-600 to-slate-800"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-slate-500"
      />
      <UsersManagement />
    </div>
  );
}
