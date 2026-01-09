import { MainLayout } from '@/components/layout/main-layout';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Lista de emails admin (mesma do servidor)
  const adminEmails = ['tiagosousa.tams@hotmail.com'];
  
  // Obter email do usuário do Clerk como fallback
  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  const isAdminEmail = userEmail && adminEmails.includes(userEmail);

  // Verificar se é admin
  let isAdmin = false;
  try {
    const user = await api.users.getCurrent();
    isAdmin = user.role === 'admin';
    console.log('Admin page check - API user:', { role: user.role, isAdmin });
  } catch (error) {
    console.error('Admin page - Error fetching user from API:', error);
    // Se a API falhar, usar verificação de email como fallback
    if (isAdminEmail) {
      console.log('Admin page - Using email fallback, user is admin');
      isAdmin = true;
    } else {
      console.log('Admin page - User is not admin and API failed');
    }
  }

  // Permitir acesso se for admin OU se o email estiver na lista de admins
  if (!isAdmin && !isAdminEmail) {
    console.log('Admin page - Access denied, redirecting to home');
    redirect('/');
  }

  return (
    <MainLayout>
      <AdminDashboard />
    </MainLayout>
  );
}

export const dynamic = 'force-dynamic';
