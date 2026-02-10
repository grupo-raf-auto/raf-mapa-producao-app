import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { FormulariosContent } from '@/components/formularios/formularios-content';

export default function FormulariosPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <FormulariosContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
