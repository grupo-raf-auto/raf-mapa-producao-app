'use client';

import { Button } from '@/components/ui/button';
import { UsersManagement } from './users-management';
import { UserPerformance } from './user-performance';
import { AdminConsultasContent } from './admin-consultas-content';
import { TemplatesManagement } from './templates-management';
import { DocumentsManager } from '@/components/mysabichao/documents-manager';
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
import { useState } from 'react';

type TabValue = 'users' | 'consultas' | 'performance' | 'templates' | 'documents' | 'tickets';

const tabs: { value: TabValue; label: string; icon: React.ElementType }[] = [
  { value: 'users', label: 'Utilizadores', icon: Users },
  { value: 'consultas', label: 'Consultas', icon: Search },
  { value: 'performance', label: 'Desempenho', icon: TrendingUp },
  { value: 'templates', label: 'Templates', icon: FileStack },
  { value: 'documents', label: 'Ficheiros', icon: FileText },
  { value: 'tickets', label: 'Tickets', icon: Ticket },
];

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabValue>('users');

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3">
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

          {/* Center: Tabs (desktop only) */}
          <div className="hidden lg:flex items-center bg-muted/50 rounded-full p-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.value
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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

        {/* Mobile/Tablet Tabs */}
        <div className="lg:hidden mt-4 flex items-center bg-muted/50 rounded-full p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-xs font-medium transition-all ${
                  activeTab === tab.value
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <UsersManagement key={`users-${refreshKey}`} />
      )}

      {activeTab === 'consultas' && (
        <AdminConsultasContent key={`consultas-${refreshKey}`} />
      )}

      {activeTab === 'performance' && (
        <UserPerformance key={`performance-${refreshKey}`} />
      )}

      {activeTab === 'templates' && (
        <TemplatesManagement key={`templates-${refreshKey}`} />
      )}

      {activeTab === 'documents' && (
        <DocumentsManager key={`docs-${refreshKey}`} />
      )}

      {activeTab === 'tickets' && (
        <div className="bg-card rounded-2xl p-8 shadow-sm border text-center">
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tickets</h3>
          <p className="text-muted-foreground">
            Sistema de tickets em desenvolvimento.
          </p>
        </div>
      )}
    </div>
  );
}
