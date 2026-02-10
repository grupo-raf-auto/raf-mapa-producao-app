import { MessageSquare } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { MessageGeneratorContent } from '@/components/message-generator/message-generator-content';

export default function GeradorMensagensPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="flex-1 flex flex-col min-h-0">
          <PageHeader
            title="MyTexto"
            description="Gere textos para email e WhatsApp com IA. Escolha o contexto e o template para responder aos clientes de forma rápida e profissional."
            icon={MessageSquare}
            iconGradient="from-red-600 via-red-500 to-red-700"
          />
          <div className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
              <MessageGeneratorContent />
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
