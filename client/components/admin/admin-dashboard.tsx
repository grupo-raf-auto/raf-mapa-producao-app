'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { UsersManagement } from './users-management';
import { UserPerformance } from './user-performance';
import { AdminConsultasContent } from './admin-consultas-content';
import { TemplatesManagement } from './templates-management';
import { DocumentsManager } from '@/components/mysabichao/documents-manager';
import { AdminTicketsContent } from './admin-tickets-content';
import { AdminLayout, type AdminTabValue } from './admin-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Shield } from 'lucide-react';
import {
  Users,
  FileText,
  Ticket,
  Search,
  TrendingUp,
  FileStack,
  LucideIcon,
} from 'lucide-react';

const tabConfig: Record<
  AdminTabValue,
  { title: string; description: string; icon: LucideIcon }
> = {
  users: {
    title: 'Utilizadores',
    description:
      'Gestão de utilizadores do sistema. Crie, edite e configure permissões de acesso.',
    icon: Users,
  },
  consultas: {
    title: 'Consultas',
    description:
      'Visualize todas as consultas realizadas no sistema. Filtre por data, utilizador e status.',
    icon: Search,
  },
  performance: {
    title: 'Desempenho',
    description:
      'Análise de métricas e desempenho dos utilizadores. Acompanhe produtividade e resultados.',
    icon: TrendingUp,
  },
  templates: {
    title: 'Templates',
    description:
      'Gestão de templates de formulários. Crie e configure modelos para submissões.',
    icon: FileStack,
  },
  documents: {
    title: 'Ficheiros',
    description:
      'Gestão de documentos do sistema. Upload e organização de ficheiros para o MySabichão.',
    icon: FileText,
  },
  tickets: {
    title: 'Tickets',
    description:
      'Sistema de suporte e tickets. Acompanhe pedidos de ajuda dos utilizadores.',
    icon: Ticket,
  },
};

const VALID_TABS: AdminTabValue[] = [
  'users',
  'consultas',
  'performance',
  'templates',
  'documents',
  'tickets',
];

export function AdminDashboard() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as AdminTabValue | null;
  const [activeTab, setActiveTab] = useState<AdminTabValue>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'users',
  );

  useEffect(() => {
    if (
      tabFromUrl &&
      VALID_TABS.includes(tabFromUrl) &&
      tabFromUrl !== activeTab
    ) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const currentTab = tabConfig[activeTab];

  return (
    <AdminLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)}>
      <div className="space-y-6">
        <PageHeader
          title={currentTab.title}
          description={currentTab.description}
          icon={currentTab.icon}
          iconGradient="from-slate-700 via-slate-600 to-slate-800"
          decoratorIcon={<Shield className="w-5 h-5" />}
          decoratorColor="text-slate-500"
        />

        {activeTab === 'users' && <UsersManagement />}

        {activeTab === 'consultas' && <AdminConsultasContent />}

        {activeTab === 'performance' && <UserPerformance />}

        {activeTab === 'templates' && <TemplatesManagement />}

        {activeTab === 'documents' && <DocumentsManager />}

        {activeTab === 'tickets' && <AdminTicketsContent />}
      </div>
    </AdminLayout>
  );
}
