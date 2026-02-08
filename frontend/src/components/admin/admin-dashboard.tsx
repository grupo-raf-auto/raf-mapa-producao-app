'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SearchBar, type SearchItem } from '@/components/ui/search-bar';
import {
  Users,
  FileText,
  Ticket,
  RefreshCw,
  Shield,
  Search,
  TrendingUp,
  FileStack,
} from 'lucide-react';

type TabValue =
  | 'users'
  | 'consultas'
  | 'performance'
  | 'templates'
  | 'documents'
  | 'tickets';

const tabs: { value: TabValue; label: string; icon: React.ElementType }[] = [
  { value: 'users', label: 'Utilizadores', icon: Users },
  { value: 'consultas', label: 'Consultas', icon: Search },
  { value: 'performance', label: 'Desempenho', icon: TrendingUp },
  { value: 'templates', label: 'Templates', icon: FileStack },
  { value: 'documents', label: 'Ficheiros', icon: FileText },
  { value: 'tickets', label: 'Tickets', icon: Ticket },
];

// Context to share refreshKey with child routes
const AdminRefreshContext = createContext<{ refreshKey: number }>({
  refreshKey: 0,
});

export function useAdminRefresh() {
  return useContext(AdminRefreshContext);
}

function getActiveTab(pathname: string): TabValue {
  const segment = pathname.replace(/^\/admin\/?/, '').split('/')[0];
  const match = tabs.find((t) => t.value === segment);
  return match ? match.value : 'users';
}

// Quick-access searchable items for admin panel navigation
const adminSearchItems: SearchItem[] = [
  {
    id: 'users',
    title: 'Gestão de Utilizadores',
    description:
      'Visualizar, aprovar e gerir contas de utilizadores registados na plataforma.',
    tags: ['Utilizadores', 'Contas', 'Aprovação'],
  },
  {
    id: 'consultas',
    title: 'Consultas',
    description:
      'Consultar e filtrar todas as submissões feitas pelos utilizadores.',
    tags: ['Consultas', 'Submissões', 'Filtros'],
  },
  {
    id: 'performance',
    title: 'Desempenho',
    description:
      'Analisar métricas de performance, atividade e estatísticas do sistema.',
    tags: ['Desempenho', 'Métricas', 'Estatísticas'],
  },
  {
    id: 'templates',
    title: 'Templates',
    description:
      'Criar, editar e gerir templates de formulários disponíveis na plataforma.',
    tags: ['Templates', 'Formulários', 'Configuração'],
  },
  {
    id: 'documents',
    title: 'Ficheiros',
    description:
      'Aceder e gerir documentos e ficheiros carregados pelos utilizadores.',
    tags: ['Ficheiros', 'Documentos', 'Upload'],
  },
  {
    id: 'tickets',
    title: 'Tickets de Suporte',
    description:
      'Gerir pedidos de suporte e acompanhar o estado de resolução dos tickets.',
    tags: ['Tickets', 'Suporte', 'Resolução'],
  },
];

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(pathname);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSearchSelect = (item: SearchItem) => {
    navigate(`/admin/${item.id}`);
  };

  return (
    <AdminRefreshContext.Provider value={{ refreshKey }}>
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-title text-xl font-bold text-foreground">
                  Painel Admin
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerir utilizadores
                </p>
              </div>
            </div>

            {/* Right: Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2 rounded-full shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:flex items-center bg-muted/50 rounded-full p-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.value}
                  to={`/admin/${tab.value}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.value
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile/Tablet Tabs */}
          <div className="lg:hidden flex items-center bg-muted/50 rounded-full p-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.value}
                  to={`/admin/${tab.value}`}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeTab === tab.value
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search Bar - Quick Access */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border">
          <SearchBar
            data={adminSearchItems}
            placeholder="Pesquisar no painel..."
            onSelect={handleSearchSelect}
            emptyMessage="Nenhuma secção encontrada."
            scrollHeight="h-80"
          />
        </div>

        {/* Content — rendered by nested route */}
        <Outlet />
      </div>
    </AdminRefreshContext.Provider>
  );
}
