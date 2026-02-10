import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { ConsultasContent } from '@/components/consultas/consultas-content';

export default function ConsultasPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ConsultasContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
