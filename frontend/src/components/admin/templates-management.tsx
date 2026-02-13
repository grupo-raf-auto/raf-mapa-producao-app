import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileStack, Shield, Database } from 'lucide-react';
import { CreateTemplateDialog } from '@/components/templates/create-template-dialog';
import { TemplatesList } from '@/components/templates/templates-list';
import { PageHeader } from '@/components/ui/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

function LoadingBars({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <style>
        {`
          .bar { animation: pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          .bar:nth-child(2) { animation-delay: 0.15s; }
          .bar:nth-child(3) { animation-delay: 0.3s; }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scaleY(0.6); }
            50% { opacity: 1; transform: scaleY(1); }
          }
        `}
      </style>
      <rect className="bar" x="4" y="6" width="4" height="12" rx="1" />
      <rect className="bar" x="10" y="6" width="4" height="12" rx="1" />
      <rect className="bar" x="16" y="6" width="4" height="12" rx="1" />
    </svg>
  );
}

export function TemplatesManagement() {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const result = (await apiClient.admin.seed()) as {
        success?: boolean;
        created?: { questions: number; templates: number };
        skipped?: { questions: number; templates: number };
      };
      const created = result?.created ?? { questions: 0, templates: 0 };
      const skipped = result?.skipped ?? { questions: 0, templates: 0 };
      toast.success(
        `Templates restaurados. Criados: ${created.templates} templates, ${created.questions} questões. Ignorados: ${skipped.templates} templates, ${skipped.questions} questões.`,
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('templates-updated'));
        window.dispatchEvent(new CustomEvent('questions-updated'));
      }
    } catch (error) {
      toast.error('Erro ao restaurar templates iniciais');
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <PageHeader
          title="Templates"
          description="Criar e gerir modelos de formulários."
          icon={FileStack}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<Shield className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <CreateTemplateDialog>
            <Button className="gap-2 rounded-xl shrink-0 w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation">
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          </CreateTemplateDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isSeeding}
                className="gap-2 rounded-xl shrink-0 w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                <Database className="w-4 h-4" />
                Restaurar Templates
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar templates iniciais?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá criar as questões e templates padrão (Apontamento Seguros,
                  Crédito, Imobiliário). Templates já existentes com o mesmo nome serão
                  ignorados. Não inclui dados dummy.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSeed} disabled={isSeeding}>
                  {isSeeding ? (
                    <>
                      <LoadingBars className="h-4 w-4 mr-2" />
                      A restaurar...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Restaurar Templates
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <TemplatesList showFillButton={false} />
    </div>
  );
}
