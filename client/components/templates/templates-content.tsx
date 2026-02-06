'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Layers } from 'lucide-react';
import { CreateTemplateDialog } from './create-template-dialog';
import { TemplatesList } from './templates-list';
import { PageHeader } from '@/components/ui/page-header';
import { useSession } from '@/lib/auth-client';

export function TemplatesContent() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  // Key para forçar refresh do TemplatesList sem hard reload
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTemplateCreated = useCallback(() => {
    // Incrementar a key força o TemplatesList a recarregar
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative">
        <PageHeader
          title="Templates"
          description={
            isAdmin
              ? 'Crie e gerencie templates. Associe questões e defina o modelo (Crédito, Imobiliária, Seguros) para os utilizadores preencherem.'
              : 'Templates disponíveis para o seu modelo. Selecione um para preencher.'
          }
          icon={FileText}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<Layers className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        {isAdmin && (
          <div className="absolute top-0 right-0">
            <CreateTemplateDialog onCreated={handleTemplateCreated}>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Template
              </Button>
            </CreateTemplateDialog>
          </div>
        )}
      </div>

      <TemplatesList key={refreshKey} showEditActions={isAdmin} />
    </div>
  );
}
