import { MainLayout } from '@/components/layout/main-layout';
import { HelpContent } from '@/components/help/help-content';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HelpPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <MainLayout>
      <HelpContent />
    </MainLayout>
  );
}

export const dynamic = 'force-dynamic';
