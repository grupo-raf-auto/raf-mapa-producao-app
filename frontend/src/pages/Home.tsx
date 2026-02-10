import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardWrapper />
      </MainLayout>
    </ProtectedRoute>
  );
}
