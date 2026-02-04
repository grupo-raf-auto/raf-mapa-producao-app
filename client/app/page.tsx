import { MainLayout } from '@/components/layout/main-layout';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';
import { auth } from '@/lib/auth';
import { createAppToken } from '@/lib/jwt';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Never cache - ensure latest auth state

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  // If no session, redirect to login immediately
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Verify session is still valid (security check)
  // This ensures user can't access dashboard after logout due to caching
  if (!session.user.id || !session.user.email) {
    redirect('/sign-in');
  }

  // Role-based access control: admins must use /admin dashboard
  if (session.user.role === 'admin') {
    redirect('/admin');
  }

  // Check if user has any models; redirect to select-models if not (use session to create API token)
  try {
    const token = createAppToken({
      sub: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? null,
    });
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/user-models/my-models`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      },
    );
    if (response.ok) {
      const json = await response.json();
      const list = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];
      if (list.length === 0) {
        redirect('/select-models');
      }
    }
  } catch (error) {
    // Next.js redirect() throws; re-throw so the redirect is not swallowed
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      String((error as { digest?: string }).digest).includes('NEXT_REDIRECT')
    ) {
      throw error;
    }
    console.error('Error checking user models:', error);
  }

  return (
    <MainLayout>
      <DashboardWrapper />
    </MainLayout>
  );
}
