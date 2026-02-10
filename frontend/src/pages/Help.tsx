import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { HelpContent } from '@/components/help/help-content';

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <HelpContent variant="user" />
      </MainLayout>
    </ProtectedRoute>
  );
}
