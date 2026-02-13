import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Settings } from 'lucide-react';
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
          <AnimatedTabs
            tabs={[
              { label: 'Perfil', value: 'profile' },
              { label: 'Aplicação', value: 'app' },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
          />
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
