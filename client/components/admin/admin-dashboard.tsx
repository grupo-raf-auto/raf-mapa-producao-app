'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UsersManagement } from './users-management';
import { UserPerformance } from './user-performance';
import { AdminConsultasContent } from './admin-consultas-content';
import { TemplatesManagement } from './templates-management';
import { DocumentsManager } from '@/components/mysabichao/documents-manager';
import {
  Users,
  Search,
  TrendingUp,
  ArrowLeft,
  FileStack,
  Shield,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-title text-2xl font-bold text-foreground">
                Painel de Administração
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerir utilizadores, aprovações e permissões do sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-10">
          <TabsTrigger
            value="users"
            className="gap-2 data-[state=active]:bg-card"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utilizadores</span>
          </TabsTrigger>
          <TabsTrigger
            value="consultas"
            className="gap-2 data-[state=active]:bg-card"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Consultas</span>
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="gap-2 data-[state=active]:bg-card"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Desempenho</span>
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="gap-2 data-[state=active]:bg-card"
          >
            <FileStack className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="gap-2 data-[state=active]:bg-card"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="consultas" className="mt-4">
          <AdminConsultasContent />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <UserPerformance />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesManagement />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
