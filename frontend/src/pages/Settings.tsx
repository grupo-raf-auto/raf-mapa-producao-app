import { ProtectedRoute } from '@/components/layout/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { SettingsContent } from '@/components/settings/settings-content';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <SettingsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
