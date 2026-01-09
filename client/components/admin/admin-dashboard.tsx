'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UsersManagement } from './users-management';
import { SystemStats } from './system-stats';
import { UserPerformance } from './user-performance';
import { SettingsPanel } from './settings-panel';
import { TemplatesManagementDialog } from './templates-management-dialog';
import { Users, BarChart3, Settings, TrendingUp, ArrowLeft, FileStack } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AdminDashboard() {
  const router = useRouter();
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Painel de Administração
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gerencie usuários, visualize estatísticas e configure o sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setTemplatesDialogOpen(true)}
            variant="default"
            className="gap-2"
          >
            <FileStack className="w-4 h-4" />
            Gerenciar Templates
          </Button>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Desempenho
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <UserPerformance />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersManagement />
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
