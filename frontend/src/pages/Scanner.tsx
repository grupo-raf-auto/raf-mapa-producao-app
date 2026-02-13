import { FileCheck } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { DocumentScanner } from '@/components/document-scanner';

export default function ScannerPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="flex-1 flex flex-col min-h-0">
          <PageHeader
            title="MyScanner"
            description="Análise de manipulação e integridade documental."
            icon={FileCheck}
          />
          <div className="flex-1 overflow-auto flex items-center justify-center min-h-[320px]">
            <div className="p-6 max-w-4xl w-full">
              <DocumentScanner />
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
