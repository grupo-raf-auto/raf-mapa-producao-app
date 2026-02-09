import { Button } from '@/components/ui/button';
import { Plus, FileStack, Shield } from 'lucide-react';
import { CreateTemplateDialog } from '@/components/templates/create-template-dialog';
import { TemplatesList } from '@/components/templates/templates-list';
import { PageHeader } from '@/components/ui/page-header';

export function TemplatesManagement() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Templates"
          description="Criar e gerir modelos de formulários."
          icon={FileStack}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<Shield className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <CreateTemplateDialog>
          <Button className="gap-2 rounded-xl shrink-0">
            <Plus className="w-4 h-4" />
            Novo Template
          </Button>
        </CreateTemplateDialog>
      </div>

      <TemplatesList showFillButton={false} />
    </div>
  );
}
