import { MainLayout } from '@/components/layout/main-layout';
import { TemplatesContent } from '@/components/templates/templates-content';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';

export default async function TemplatesPage() {
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
  } catch (error) {
    console.error('Templates page - Error fetching user from API:', error);
    // Se a API falhar, usar verificação de email como fallback
    if (isAdminEmail) {
      isAdmin = true;
    }
  }

  // Permitir acesso se for admin OU se o email estiver na lista de admins
  if (!isAdmin && !isAdminEmail) {
    redirect('/');
  }

  return (
    <MainLayout>
      <TemplatesContent />
    </MainLayout>
  );
}

export const dynamic = 'force-dynamic';
