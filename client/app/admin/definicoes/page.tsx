import { MainLayout } from '@/components/layout/main-layout';
import { AdminLayout } from '@/components/admin/admin-layout';
import { SettingsContent } from '@/components/settings/settings-content';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api.server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminDefinicoesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  let isAdmin = false;
  let error: string | null = null;

  try {
    const user = await api.users.getCurrent();
    isAdmin = user?.role === 'admin';
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('NetworkError')
    ) {
      error =
        'Servidor backend não está acessível. Verifique se o servidor está rodando.';
    } else {
      error = `Erro ao verificar permissões: ${errorMessage}`;
    }
    console.error('Erro ao verificar permissões de admin:', err);
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 p-6 border border-destructive/50 rounded-lg bg-destructive/10 max-w-md">
            <h2 className="text-xl font-semibold text-destructive">
              Erro ao acessar definições
            </h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <MainLayout>
      <AdminLayout>
        <SettingsContent />
      </AdminLayout>
    </MainLayout>
  );
}

export const dynamic = 'force-dynamic';
