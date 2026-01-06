import { MainLayout } from '@/components/layout/main-layout';
import { TemplatesContent } from '@/components/templates/templates-content';

export default function TemplatesPage() {
  return (
    <MainLayout>
      <TemplatesContent />
    </MainLayout>
  );
}

export const dynamic = 'force-dynamic';
