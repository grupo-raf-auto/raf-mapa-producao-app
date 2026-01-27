'use client';

import { FileCheck } from 'lucide-react';
import { DocumentScanner } from '@/components/document-scanner';
import { PageHeader } from '@/components/ui/page-header';
import { MainLayout } from '@/components/layout/main-layout';

export default function ScannerPage() {
  return (
    <MainLayout>
      <div className="flex-1 flex flex-col">
        <PageHeader
          title="MyScanner"
          description="Analise documentos para detecção de fraudes e alterações"
          icon={FileCheck}
        />
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="p-6 max-w-4xl w-full">
            <DocumentScanner />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
