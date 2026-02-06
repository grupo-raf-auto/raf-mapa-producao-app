import { MainLayout } from '@/components/layout/main-layout';
import { SettingsContent } from '@/components/settings/settings-content';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <MainLayout>
      <SettingsContent />
    </MainLayout>
  );
}

export const dynamic = 'force-dynamic';
