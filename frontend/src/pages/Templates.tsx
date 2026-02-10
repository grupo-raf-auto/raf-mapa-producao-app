import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { TemplatesContent } from '@/components/templates/templates-content';

export default function TemplatesPage() {
  return (
    <ProtectedRoute requireAdmin>
      <MainLayout>
        <TemplatesContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
