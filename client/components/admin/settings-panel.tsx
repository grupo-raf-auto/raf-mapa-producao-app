'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SettingsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Painel de configurações será implementado em breve.
        </p>
      </CardContent>
    </Card>
  );
}
