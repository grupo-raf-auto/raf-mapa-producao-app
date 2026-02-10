import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <MainLayout>
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </MainLayout>
    </ProtectedRoute>
  );
}
