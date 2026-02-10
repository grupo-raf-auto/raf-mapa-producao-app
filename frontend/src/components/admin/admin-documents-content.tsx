import { FileText, Shield } from 'lucide-react';
import { DocumentsManager } from '@/components/mysabichao/documents-manager';
import { PageHeader } from '@/components/ui/page-header';

export function AdminDocumentsContent() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      <PageHeader
        title="Ficheiros"
        description="Documentos carregados e processados para o assistente."
        icon={FileText}
        iconGradient="from-red-600 via-red-500 to-red-700"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-red-500"
      />
      <DocumentsManager />
    </div>
  );
}
