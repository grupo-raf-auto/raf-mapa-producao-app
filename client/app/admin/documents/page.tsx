'use client';

import { DocumentsManager } from '@/components/mysabichao/documents-manager';
import { PageHeader } from '@/components/ui/page-header';
import { Shield, FileText } from 'lucide-react';

export default function AdminDocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ficheiros"
        description="Gestão de documentos do sistema. Upload e organização de ficheiros para o MySabichão."
        icon={FileText}
        iconGradient="from-slate-700 via-slate-600 to-slate-800"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-slate-500"
      />
      <DocumentsManager />
    </div>
  );
}
