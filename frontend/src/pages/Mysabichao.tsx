import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { MySabichaoContent } from '@/components/mysabichao/mysabichao-content';

export default function MysabichaoPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <MySabichaoContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
