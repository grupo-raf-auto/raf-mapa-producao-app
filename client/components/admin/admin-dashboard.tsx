'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UsersManagement } from './users-management';
import { SystemStats } from './system-stats';
import { UserPerformance } from './user-performance';
import { SettingsPanel } from './settings-panel';
import { TemplatesManagementDialog } from './templates-management-dialog';
import { Users, BarChart3, Settings, TrendingUp, ArrowLeft, FileStack, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AdminDashboard() {
  const router = useRouter();
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-title text-2xl md:text-3xl font-bold text-foreground">
                Painel de Administração
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerir utilizadores, aprovações e permissões do sistema
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setTemplatesDialogOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <FileStack className="w-4 h-4" />
          <span className="hidden sm:inline">Gerir Templates</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-11">
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-card">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utilizadores</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2 data-[state=active]:bg-card">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Desempenho</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-card">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-card">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <UserPerformance />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <SystemStats />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsPanel />
        </TabsContent>
      </Tabs>

      <TemplatesManagementDialog
        open={templatesDialogOpen}
        onOpenChange={setTemplatesDialogOpen}
      />
    </div>
  );
}
