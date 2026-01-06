import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-textPrimary">
            Configurações
          </h1>
          <p className="text-sm text-textSecondary mt-2">
            Gerencie as configurações do sistema
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configure as preferências do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-textSecondary">Em breve...</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
