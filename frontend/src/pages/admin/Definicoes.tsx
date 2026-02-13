import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Paintbrush } from 'lucide-react';
import { SettingsContent } from '@/components/settings/settings-content';
import { AdminAppSettings } from '@/components/admin/admin-app-settings';

export default function AdminDefinicoesPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-8 px-1 sm:px-0">
      <PageHeader
        title="Definições"
        description="Gerir configurações pessoais e da aplicação."
        icon={Settings}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="inline-flex h-11 items-center justify-center rounded-xl bg-muted p-1.5 text-muted-foreground shadow-sm">
            <TabsTrigger
              value="profile"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Settings className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger
              value="app"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Paintbrush className="h-4 w-4" />
              Aplicação
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-0">
          <SettingsContent />
        </TabsContent>

        <TabsContent value="app" className="mt-0">
          <AdminAppSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
